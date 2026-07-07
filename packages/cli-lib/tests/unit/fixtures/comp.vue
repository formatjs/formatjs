<template>
  <p>
    {{
      $formatMessage({
        defaultMessage: 'in template',
        description: 'in template desc',
      })
    }}
  </p>
  <p>{{ $t('in.template.id') }}</p>
</template>

<script>
intl.formatMessage({
  defaultMessage: 'in script',
  description: 'in script desc',
})
this.$t('in.script.id')
</script>
