import { CodeEditor } from '@devbookhq/code-editor'
import { Decoration, EditorView } from '@codemirror/view'
import { Loader as LoaderIcon } from 'lucide-react'
import {
  OutStderrResponse,
  OutStdoutResponse,
  OutType,
  Process,
} from '@devbookhq/react'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { oneDark } from '@codemirror/theme-one-dark'
import { useSharedSession } from '@devbookhq/react'
import path from 'path-browserify'

import { rootdir } from 'utils/constants'
import Text from 'components/typography/Text'
import { supportedLanguages } from 'apps/languages'

import CopyToClipboardButton from '../CopyToClipboardButton'
import RunButton from '../RunButton'
import StopButton from '../StopButton'
import { useAppContext } from '../AppContext'
import { notEmpty } from 'utils/notEmpty'
import { onlyUnique } from 'utils/onlyUnique'

const darkEditorTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-gutters': { background: '#282c34' },
  '.cm-scroller': { overflow: 'auto' },
})

const lineHighlightMark = Decoration.line({
  attributes: { style: 'background: yellow; cursor: pointer;' },
})

const lineIndicateMark = Decoration.line({
  attributes: { style: 'background: #3d424d; cursor: pointer;' },
})

export interface Props {
  file?: string
  lang?: string
  onRun?: (code: string) => string
  children: ReactNode
  isEditable?: boolean
}

function Code({
  file,
  lang,
  onRun,
  children,
  isEditable,
}: Props) {
  const [process, setProcess] = useState<Process>()
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<(OutStdoutResponse | OutStderrResponse)[]>([])
  const { session } = useSharedSession()
  const isRunnable = !!onRun
  const [appCtx, setAppCtx] = useAppContext()

  const highlightedLines = useMemo(() => {
    const lines = Object.values(appCtx.Explanation)
      .filter(notEmpty)
      .filter(v => v.enabled)
      .flatMap(v => v.highlightLines)
      .filter(onlyUnique)

    return lines
  }, [appCtx.Explanation])

  const indicatedLines = useMemo(() => {
    const lines = Object.values(appCtx.Explanation)
      .filter(notEmpty)
      .flatMap(v => v.highlightLines)
      .filter(onlyUnique)

    return lines
  }, [appCtx.Explanation])

  const appendOutput = useCallback((out: OutStdoutResponse | OutStderrResponse) => {
    setOutput(arr => [...arr, out])
  }, [])

  const run = useCallback(() => {
    if (!onRun) return
    if (!session) return

    const cmd = onRun(children as string)
    setOutput([])
    session.process?.start({
      cmd,
      onStdout: appendOutput,
      onStderr: appendOutput,
      onExit: () => setIsRunning(false),
    }).then(setProcess)
      .catch(err => {
        const e: OutStderrResponse = {
          line: err,
          timestamp: Date.now(),
          type: OutType.Stderr,
        }
        appendOutput(e)
      })
    setIsRunning(true)
  }, [
    onRun,
    session,
    children,
    appendOutput,
  ])

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(children as string)
  }, [children])

  const stop = useCallback(() => {
    process?.kill()
  }, [
    process,
  ])

  const writeFile = useCallback((content: string) => {
    if (!file) return
    const replacedCode = content
      .replace('\'yourUsername-country-US\'', 'process.env.USERNAME + "-country-US"')
      .replace('\'yourPassword\'', 'process.env.PASSWORD')

    session?.filesystem?.write(path.join(rootdir, file), replacedCode)
  }, [
    session,
    file,
  ])

  const handleLineHover = useCallback((line: number | undefined) => {
    setAppCtx(d => {
      d.Code.hoveredLine = line
    })
  }, [setAppCtx])

  useEffect(function writeInitialFile() {
    if (typeof children === 'string') {
      writeFile(children)
    }
  }, [writeFile, children])

  return (
    <div
      style={{
        colorScheme: 'dark',
      }}
      className="
        w-full
        flex
        flex-col
        items-stretch
        justify-start
        border
        border-indigo-400/20
        bg-gray-800
        overflow-hidden
    ">
      <div className="
        py-1
        px-3
        flex
        items-center
        self-stretch
        justify-between
      ">
        <Text
          className="text-gray-400"
          text={file || ''}
        />
        <div />
        <div className="
          flex
          justify-start
          items-center
          space-x-1
        ">
          {isRunnable && (
            <>
              {!isRunning ? (
                <RunButton
                  onClick={run}
                />
              ) : (
                <StopButton
                  onClick={stop}
                />
              )}
            </>
          )}
          <CopyToClipboardButton
            onClick={handleCopyToClipboard}
          />
        </div>
      </div>
      <div className="
        flex-1
        overflow-hidden
        relative
      ">
        <CodeEditor
          className={`
            absolute
            inset-0
            ${isRunnable ? 'not-prose' : 'not-prose rounded-b-lg'}
          `}
          highlightDecoration={lineHighlightMark}
          indicateDecoration={lineIndicateMark}
          highlightedLines={highlightedLines}
          indicatedLines={indicatedLines}
          content={children as string}
          filename={file ? path.join(rootdir, file) : path.join(rootdir, `dummy-name-${Math.floor(Math.random() * 1000)}.${lang}`)}
          supportedLanguages={supportedLanguages}
          theme={[oneDark, darkEditorTheme]}
          isReadOnly={!isEditable}
          onContentChange={writeFile}
          onLineHover={handleLineHover}
        />
      </div>
      {isRunnable &&
        <div className="
          pl-4
          pr-2
          py-2
          font-mono
          text-gray-300
          flex
          h-[300px]
          items-stretch
          justify-start
          flex-col
          space-y-0.5
        ">
          <div className="
            flex
            justify-start
            items-center
            space-x-1
          ">
            <Text
              className="text-gray-500"
              size={Text.size.S3}
              text="Output"
            />
            {isRunning &&
              <LoaderIcon
                className="
                  text-gray-500
                  animate-spin
                "
                size={14}
              />
            }
          </div>

          <div className="flex flex-1 overflow-auto flex-col scroller">
            {output.map(o => (
              <div
                className="
                flex
                items-stretch
                justify-start
                whitespace-pre
                space-x-1
              "
                key={o.timestamp}
              >
                <Text
                  className="text-gray-600"
                  text=">"
                />
                <Text
                  className={o.type === OutType.Stdout ? 'text-slate-200' : 'text-red-500'}
                  text={o.line}
                />
              </div>
            ))}
          </div>
        </div>
      }
    </div>
  )
}

export default Code
