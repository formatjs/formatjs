import {MessageDescriptor} from '@formatjs/ts-transformer';
import {parseScript} from '../../src/parse_script';
import {parseFile} from '../../src/vue_extractor';

test('vue_extractor', function () {
  let messages: MessageDescriptor[] = [];

  parseFile(
    `
      <template>
      <p>
        {{
          $formatMessage({
            defaultMessage: 'in template',
            description: 'in template desc',
          })
        }}
      </p>
    </template>
    
    <script>
    intl.formatMessage({
      defaultMessage: 'in script',
      description: 'in script desc',
    });
    </script>
    `,
    'comp.vue',
    parseScript({
      additionalFunctionNames: ['$formatMessage'],
      extractFromFormatMessageCall: true,
      onMsgExtracted(_, msgs) {
        messages = messages.concat(msgs);
      },
      overrideIdFn: '[contenthash:5]',
    })
  );
  expect(messages).toEqual([
    {
      defaultMessage: 'in template',
      description: 'in template desc',
      id: 'f6d14',
    },
    {
      defaultMessage: 'in script',
      description: 'in script desc',
      id: '1ebd4',
    },
  ]);
});
