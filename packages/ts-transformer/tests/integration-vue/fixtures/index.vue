<template>
  <p>
    Index
    {{ $formatMessage({defaultMessage: 'test message (id not injected)'}) }}
  </p>
</template>

<script lang="ts">
import {inject} from 'vue'
import {Vue} from 'vue-class-component'

class Index extends Vue {
  public created() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const intl = inject('intl')!

    console.log(
      // @ts-ignore
      intl.formatMessage({defaultMessage: 'message in created (id injected)'})
    )
  }
}

export default Index
</script>

<script lang="ts" setup>
const intl = useIntl()
console.log(intl.formatMessage({defaultMessage: 'script setup'}))
</script>
