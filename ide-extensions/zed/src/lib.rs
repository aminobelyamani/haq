use zed_extension_api::{self as zed, Result};

struct Extension;

impl zed::Extension for Extension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &zed::LanguageServerId,
        _worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        Ok(zed::Command {
        	command: zed::node_binary_path()?,
            args: vec![
                "/Users/aminobelyamani/Sites/Code/TS/Packages/haq/packages/language-server/@dist/index.js"
                    .to_string(),
            ],
            env: vec![],
        })
    }
}

zed::register_extension!(Extension);
