import { CodeEditor } from '@devbookhq/code-editor'
import { EditorView } from '@codemirror/view'
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
import { notEmpty } from 'utils/notEmpty'
import { onlyUnique } from 'utils/onlyUnique'

import CopyToClipboardButton from '../CopyToClipboardButton'
import RunButton from '../RunButton'
import StopButton from '../StopButton'
import { useAppContext } from '../AppContext'

const gutterHighlightRadius = '8px'

export const transition = {
  transitionProperty: 'background, opacity, color, font-size',
  transitionTimingFunction: 'cubic-bezier(0.64, 0, 0.78, 0)',
  transitionDuration: '350ms',
}

const customTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    paddingRight: '12px',
    paddingLeft: '22px',
    ...transition,
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  // Gutter styling
  '.cm-gutters': {
    background: '#282c34',
    paddingLeft: '4px',
  },
  '.cm-highlight-gutter-line': {
    color: '#e9edf2',
    background: '#64748b',
    cursor: 'pointer',
  },
  '.cm-indicate-gutter-line': {
    background: '#475569',
    cursor: 'pointer',
  },
  '.cm-dim-gutter-line': {
    opacity: '0.4;',
  },
  '.cm-lineNumbers .cm-last-gutter-line': {
    borderBottomRightRadius: gutterHighlightRadius,
    borderBottomLeftRadius: gutterHighlightRadius,
  },
  '.cm-lineNumbers .cm-first-gutter-line': {
    borderTopRightRadius: gutterHighlightRadius,
    borderTopLeftRadius: gutterHighlightRadius,
  },
  // Line styling
  '.cm-line': {
    ...transition,
  },
  '.cm-highlight-line': {
    fontSize: '13.25px;',
    cursor: 'pointer',
  },
  '.cm-dim-line': {
    opacity: '0.4',
  },
})

const theme = [oneDark, customTheme]

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
  const [proc, setProc] = useState<Process>()
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<(OutStdoutResponse | OutStderrResponse)[]>([])
  const { session } = useSharedSession()
  const isRunnable = !!onRun
  const [appCtx, setAppCtx] = useAppContext()

  const {
    highlightedLines,
    indicatedLines,
  } = useMemo(() => {
    const lines = Object
      .values(appCtx.Explanation)
      .filter(notEmpty)

    return {
      highlightedLines: lines
        .filter(v => v.enabled)
        .flatMap(v => v.highlightLines)
        .filter(onlyUnique),
      indicatedLines: lines
        .flatMap(v => v.highlightLines)
        .filter(onlyUnique)
    }
  }, [appCtx.Explanation])

  const appendOutput = useCallback((out: OutStdoutResponse | OutStderrResponse) => {
    setOutput(arr => [...arr, out])
    setAppCtx(a => {
      a.Code.output = a.Code.output ? [...a.Code.output, out.line] : [out.line]
    })
  }, [])

  const run = useCallback(() => {
    if (!onRun) return
    if (!session) return

    const cmd = onRun(children as string)
    setOutput([])
    setAppCtx(a => {
      a.Code.output = []
    })
    session.process?.start({
      cmd,
      onStdout: appendOutput,
      onStderr: appendOutput,
      onExit: () => setIsRunning(false),
    }).then(setProc)
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

  useEffect(function autorun() {
    // Disable autorun in dev because of the constant triggering on hot reload
    if (process.env.NODE_ENV !== 'development') {
      run()
    }
  }, [run])

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(children as string)
  }, [children])

  const stop = useCallback(() => {
    proc?.kill()
  }, [proc])

  const writeFile = useCallback((content: string) => {
    if (!file) return

    // TODO: This is specific for one proxyrack example - add regular env vars replacement.
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

  const handleLineClick = useCallback((line: number) => {
    Object
      .values(appCtx.Explanation)
      .forEach(v => v?.lineClickHandler?.(line))
  }, [appCtx])

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
          lintGutter={false}
          indicatedLines={indicatedLines}
          highlightedLines={highlightedLines}
          content={children as string}
          filename={file ? path.join(rootdir, file) : path.join(rootdir, `dummy-name-${Math.floor(Math.random() * 1000)}.${lang}`)}
          supportedLanguages={supportedLanguages}
          theme={theme}
          isReadOnly={!isEditable}
          onContentChange={writeFile}
          onGutterHover={handleLineHover}
          onGutterClick={handleLineClick}
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
          h-[180px]
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
                scroller
                whitespace-pre
                space-x-1
              "
                key={o.timestamp}
              >
                <Text
                  className="text-gray-600"
                  size={Text.size.S3}
                  text=">"
                />
                <Text
                  className={o.type === OutType.Stdout ? 'text-slate-200' : 'text-red-500'}
                  size={Text.size.S3}
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