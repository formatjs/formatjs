<template>
  <p>
    Hello!

    <button
      target="_blank"
      :title="
        $formatMessage({
          description: 'delete button title',
          defaultMessage: 'Send the item to the trash.',
        })
      "
      @click="
        alert(
          $formatMessage({
            description: 'delete result message',
            defaultMessage: 'The item has been deleted.',
          })
        )
      "
    >
      {{
        $formatMessage({
          description: 'delete button text',
          defaultMessage: 'Delete',
        })
      }}
    </button>
  </p>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'App',
  setup() {
    return {alert: (text: any) => alert(text)}
  },
})
</script>
