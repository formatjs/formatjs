exports.format = function (msgs) {
  const results = {}
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = {
      string: msg.defaultMessage,
      comment: msg.description,
    }
  }
  return results
}

exports.compile = function (msgs) {
  const results = {}
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = msg.string
  }
  return results
}

exports.serialize = function (msgs) {
  return Object.entries(msgs)
    .map(([id, msg]) => `${id}=${msg.string}`)
    .join('\n')
}
