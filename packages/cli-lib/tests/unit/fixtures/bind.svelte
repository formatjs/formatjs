<p>
  Hello!

  <button
    target="_blank"
    title={$formatMessage({
      description: 'delete button title',
      defaultMessage: 'Send the item to the trash.',
    })}
    class:toggled={toggle}
    onclick={
      () => alert(
        $formatMessage({
          description: 'delete result message',
          defaultMessage: 'The item has been deleted.',
        })
      )
    }
  >
    {$formatMessage({
      description: 'delete button text',
      defaultMessage: 'Delete',
    })}
  </button>
</p>

<script lang="ts">
  let toggle = true
</script>
