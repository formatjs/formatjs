<template>
  <p>
    {{
      $formatMessage({
        defaultMessage: 'in template',
        description: 'in template desc',
      })
    }}
  </p>
</template>

<script>
intl.formatMessage({
  defaultMessage: 'in script',
  description: 'in script desc',
})
</script>

<script lang="ts" setup>
const intl = useIntl()
console.log(intl.formatMessage({defaultMessage: 'script setup'}))
</script>
