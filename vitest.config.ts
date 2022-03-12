import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['tests/*.ts'],
        exclude: ['tests/_helpers.ts'],
    },
})
