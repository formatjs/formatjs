/**
 * GH #5069: Tagged template expressions with substitutions should be allowed
 * in non-message props like tagName, values, etc.
 */
import React from 'react'
import {FormattedMessage} from 'react-intl'
import styled from '@emotion/styled'
import {css} from '@emotion/react'

// Mock variables for styled-components/emotion
const blackColor = '#000'
const fontSize = 16
const fontWeight = 'bold'

export function StyledMessageComponent() {
  // Should extract messages successfully even with styled-components in tagName
  return (
    <div>
      <FormattedMessage
        id="message.with.styled.tagname"
        defaultMessage="This message uses styled-components as tagName"
        tagName={styled('div')`
          color: ${blackColor};
          font-size: ${fontSize}px;
        `}
      />

      <FormattedMessage
        id="message.with.css.tagname"
        defaultMessage="This message uses emotion css"
        tagName={css`
          font-weight: ${fontWeight};
        `}
      />

      <FormattedMessage
        id="message.with.styled.in.values"
        defaultMessage="Hello {component}"
        values={{
          component: styled('span')`
            color: ${blackColor};
          `,
        }}
      />

      {/* dedent without substitutions should still work */}
      <FormattedMessage
        id="message.with.dedent"
        defaultMessage="Message with dedent"
        description="Description with dedent"
      />
    </div>
  )
}
