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
