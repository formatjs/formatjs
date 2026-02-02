import crypto from 'crypto';

// TypeScript CLI hashing logic
const defaultMessage = 'This is a test message.';
const description = 'Test component message';

// The content is: defaultMessage#description (as JSON string)
const content = `${defaultMessage}#"${description}"`;

console.log('Content to hash:', content);

const hash = crypto.createHash('sha512')
  .update(content)
  .digest('base64')
  .slice(0, 6);

console.log('TypeScript CLI hash:', hash);

// Rust uses the same algorithm but let's verify the content format
// In Rust: content.push_str(&desc.to_string())
// For a JSON string, to_string() includes the quotes
const rustContent = `${defaultMessage}#"${description}"`;
console.log('Rust content format:', rustContent);

const rustHash = crypto.createHash('sha512')
  .update(rustContent)
  .digest('base64')
  .slice(0, 6);

console.log('Rust-style hash:', rustHash);
