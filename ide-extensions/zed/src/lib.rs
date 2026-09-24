use std::{env, fs};

use zed_extension_api::{self as zed, Result};

const SERVER_PATH: &str = "node_modules/@jsr/haq__language-server/src/index.js";
const PACKAGE_NAME: &str = "@jsr/haq__language-server";

struct HAQAstroExtension {
    did_find_server: bool,
}

impl HAQAstroExtension {
    fn server_exists(&self) -> bool {
        fs::metadata(SERVER_PATH).is_ok_and(|stat| stat.is_file())
    }

    fn jsr_error(&self, operation: &str, error: String) -> String {
        format!(
            "HAQ Astro language server: failed to {operation}.\n\n\
                     The HAQ language server is distributed through JSR.\n\
                     Please add the following to ~/.npmrc:\n\n\
                     @jsr:registry=https://npm.jsr.io/\n\n\
                     Then restart Zed.\n\n\
                     npm error: {error}"
        )
    }

    fn server_script_path(&mut self, language_server_id: &zed::LanguageServerId) -> Result<String> {
        let server_exists = self.server_exists();

        if self.did_find_server && server_exists {
            return Ok(SERVER_PATH.to_string());
        }

        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::CheckingForUpdate,
        );

        let version = zed::npm_package_latest_version(PACKAGE_NAME)
            .map_err(|error| self.jsr_error("check for updates", error))?;

        if !server_exists
            || zed::npm_package_installed_version(PACKAGE_NAME)?.as_ref() != Some(&version)
        {
            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::Downloading,
            );

            let result = zed::npm_install_package(PACKAGE_NAME, &version);

            match result {
                Ok(()) => {
                    if !self.server_exists() {
                        Err(format!(
                            "installed package '{PACKAGE_NAME}' \
                             did not contain expected path '{SERVER_PATH}'",
                        ))?;
                    }
                }
                Err(error) => {
                    if !self.server_exists() {
                        Err(self.jsr_error("download the language server", error))?;
                    }
                }
            }
        }

        self.did_find_server = true;

        Ok(SERVER_PATH.to_string())
    }
}

impl zed::Extension for HAQAstroExtension {
    fn new() -> Self {
        Self {
            did_find_server: false,
        }
    }

    fn language_server_command(
        &mut self,
        language_server_id: &zed::LanguageServerId,
        _worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let server_path = self.server_script_path(language_server_id)?;

        Ok(zed::Command {
            command: zed::node_binary_path()?,
            args: vec![env::current_dir()
                .unwrap()
                .join(&server_path)
                .to_string_lossy()
                .to_string()],
            env: Default::default(),
        })
    }
}

zed::register_extension!(HAQAstroExtension);
