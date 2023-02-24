import { useMemo } from 'react'
import { chromeLight, ObjectInspector, } from 'react-inspector'

import { useAppContext } from '../AppContext'
import Text from 'components/typography/Text'

function extractJSON(str: string): [any, number, number] | undefined {
  let firstOpen: number = 0, firstClose: number, candidate: string
  firstOpen = str.indexOf('{', firstOpen)
  do {
    firstClose = str.lastIndexOf('}')
    console.log('firstOpen: ' + firstOpen, 'firstClose: ' + firstClose)
    if (firstClose <= firstOpen) {
      return undefined
    }
    do {
      candidate = str.substring(firstOpen, firstClose + 1)
      console.log('candidate: ' + candidate)
      try {
        var res = JSON.parse(candidate)
        console.log('...found')
        return [res, firstOpen, firstClose + 1]
      }
      catch (e) {
        console.log('...failed')
      }
      firstClose = str.substring(0, firstClose).lastIndexOf('}')
    } while (firstClose > firstOpen)
    firstOpen = str.indexOf('{', firstOpen + 1)
  } while (firstOpen != -1)
}

export interface Props {
  type: 'json' | 'line'
  position?: number
  label?: string
  noContentLabel?: string
  expandPaths?: string | string[]
}

function Output({
  type,
  position = 1,
  label,
  noContentLabel,
  expandPaths,
}: Props) {
  const [appCtx] = useAppContext()
  const content = useMemo(() => {
    if (!appCtx.Code.output) return

    if (type === 'json') {
      let blob = appCtx.Code.output.join('')
      for (let i = 1; i <= position; i++) {
        const parsed = extractJSON(blob)
        if (!parsed) return

        if (i === position) {
          return parsed[0]
        } else {
          blob = blob.slice(parsed[2])
        }
      }
    } else if (type === 'line') {
      if (appCtx.Code.output.length >= position) {
        return appCtx.Code.output[position - 1]
      }
    }

  }, [appCtx.Code.output, type, position])

  return (
    <div className="
    flex
    my-2
    flex-col
    flex-1
    space-y-1
    ">
      {label &&
        <Text
          text={label}
          className="text-slate-500"
        />
      }
      <div className="
      border
      border-slate-300
      rounded
      px-4
      flex
      flex-col
      flex-1
      py-2
      space-y-2
    ">
        {noContentLabel && content === undefined &&
          <Text
            text={noContentLabel}
            size={Text.size.S3}
            className="
            text-slate-400
            "
          />
        }
        {content !== undefined && type === 'json' &&
          <ObjectInspector
            data={content}
            expandPaths={expandPaths}
            theme={{
              ...chromeLight, ...({
                TREENODE_PADDING_LEFT: 20,
                BASE_BACKGROUND_COLOR: 'transparent',
              })
            } as any}
          />
        }
        {content !== undefined && type === 'line' &&
          <div className="font-mono whitespace-pre">
            {content}
          </div>
        }
      </div>
    </div>
  )
}

export default Output