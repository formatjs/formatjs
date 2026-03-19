function FormattedMessage(_props: any) {
  return null
}

export function App() {
  return (
    <div>
      <FormattedMessage
        defaultMessage="Welcome to our app"
        description="Welcome message"
      />
      <FormattedMessage
        id="custom.id"
        defaultMessage="Custom ID message"
        description="Has a custom ID"
      />
    </div>
  )
}
