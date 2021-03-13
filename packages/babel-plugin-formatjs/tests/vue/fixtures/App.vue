<template>
  <p>
    {{
      _ctx.formatMessage(
        {id: 'myMessage', defaultMessage: 'Today is {ts, date,::yyyyMMdd}'},
        {ts: Date.now()}
      )
    }}
    <br />
    {{ $formatNumber(19, {style: 'currency', currency: 'EUR'}) }}
  </p>
</template>

<script>
intl.formatMessage({defaultMessage: 'blah'})
export default {
  name: 'App',
}
</script>
