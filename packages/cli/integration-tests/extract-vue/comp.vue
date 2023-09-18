<template>
  <p>
    {{
      $formatMessage({
        defaultMessage: 'in template',
        description: 'in template desc',
      })
    }}
  </p>
  <div class="message" v-for="message of messages">
    {{ message.content }}
  </div>
</template>

<script>
intl.formatMessage({
  defaultMessage: 'in script',
  description: 'in script desc',
})
</script>

<script lang="ts" setup>
const messages = ref([
  {
    id: 1,
    content: 'Hey, check out this adorable video, bro!!',
  },
  {
    id: 2,
    content: 'https://youtu.be/dQw4w9WgXcQ',
  },
])
const intl = useIntl()
console.log(intl.formatMessage({defaultMessage: 'script setup'}))
</script>
