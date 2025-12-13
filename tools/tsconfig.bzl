"""TypeScript configuration maps for different build targets."""

# Base tsconfig configuration (tsconfig.json)
BASE_TSCONFIG = {
    "compilerOptions": {
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "target": "es5",
        "lib": [
            "dom",
            "ES2015",
            "ES2016",
            "ES2017.Intl",
            "ES2018.Intl",
            "ES2019.Intl",
            "ES2020.Intl",
            "ES2021.intl",
            "ES2021.String",
            "ES2022.Intl",
            "ESNext.Intl",
        ],
        "baseUrl": ".",
        "declaration": True,
        "strict": True,
        "resolveJsonModule": True,
        "noUnusedLocals": True,
        "esModuleInterop": True,
        "noUnusedParameters": True,
        "preserveConstEnums": True,
        "allowSyntheticDefaultImports": True,
        "noFallthroughCasesInSwitch": True,
        "importHelpers": True,
        "isolatedDeclarations": True,
        "jsx": "react",
    },
    "exclude": [
        "packages/react-intl/example-sandboxes",
        "**/*.test-d.ts",
    ],
}

# Test configuration (tsconfig.test.json)
TEST_TSCONFIG = {
    "compilerOptions": {
        "module": "ESNext",
        "moduleResolution": "bundler",
        "target": "ESNext",
        "lib": ["dom", "ESNext"],
        "baseUrl": ".",
        "declaration": True,
        "strict": True,
        "resolveJsonModule": True,
        "noUnusedLocals": True,
        "esModuleInterop": True,
        "noUnusedParameters": True,
        "preserveConstEnums": True,
        "allowSyntheticDefaultImports": True,
        "noFallthroughCasesInSwitch": True,
        "importHelpers": True,
        "isolatedDeclarations": True,
        "noEmit": True,
        "jsx": "react",
    },
    "exclude": [
        "packages/react-intl/example-sandboxes",
        "**/*.test-d.ts",
    ],
}

# ESM configuration (tsconfig.esm.json) - merges with base
ESM_TSCONFIG = BASE_TSCONFIG | {
    "compilerOptions": BASE_TSCONFIG["compilerOptions"] | {
        "module": "ESNext",
        "moduleResolution": "Bundler",
    },
}

# ESM ESNext configuration (tsconfig.esm.esnext.json) - merges with base
ESM_ESNEXT_TSCONFIG = BASE_TSCONFIG | {
    "compilerOptions": BASE_TSCONFIG["compilerOptions"] | {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "Bundler",
    },
}

# Node configuration (tsconfig.node.json) - merges with base
NODE_TSCONFIG = BASE_TSCONFIG | {
    "compilerOptions": BASE_TSCONFIG["compilerOptions"] | {
        "target": "ES2021",
    },
}
