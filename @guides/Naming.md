# Naming Conventions

## Modules

### Code order

- Type imports
- Module imports
- Exported types
- Local types
- Exported functions
- Local functions

## Types

### Type Arguments

| Name            | Description                                                 |
| :-------------- | :---------------------------------------------------------- |
| PascalCaseShape | General shape a passed argument should extend               |
| GPA_PascalCase  | Global passed argument (class/top-level factory function)   |
| PA_PascalCase   | Passed argument                                             |
| GIA_PascalCase  | Global inferred argument (class/top-level factory function) |
| IA_PascalCase   | Inferred argument                                           |

### Exposed (API)

| Name           | Description                                                        |
| :------------- | :----------------------------------------------------------------- |
| HAQ_PascalCase | Export PascalCase as HAQ_PascalCase to avoid circular dependencies |

### Functions/Interfaces

| Name            | Description                              |
| :-------------- | :--------------------------------------- |
| RT_nameOfFunc   | Return type, NOT exposed to user         |
| ARGS_nameOfFunc | type of function arguments               |
| I_PascalCase    | Interface - especially if it has methods |
| PascalCase      | All others                               |

### Other

| Name             | Description                              |
| :--------------- | :--------------------------------------- |
| INF_PascalCase   | Inferred using the `infer` keyword       |
| `__PascalCase__` | What a string key in a record represents |

## Functions/methods

| Name           | Description      |
| :------------- | :--------------- |
| makePascalCase | Factory function |

- Scoped helper functions have `n` underscores (where `n` is the nested level)
    - `_helperFunction` -> one level deep
    - `__otherHelperFunction` -> two levels deep
