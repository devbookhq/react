import {
  EnvVars,
  components,
} from '@devbookhq/sdk'
import { useMemo } from 'react'

import useFetch from './useFetch'

export type Language = components['schemas']['Template']

export interface Props {
  codeSnippetID: string
  insertedCodeSnippetIDs?: string[]
}

export interface PublishedCodeSnippet {
  codeSnippetID: string
  codeSnippetEditorCode: string
  codeSnippetRunCode: string
  codeSnippetTitle: string
  // The env vars from server are in a string format
  codeSnippetEnvVars: string
  codeSnippetTemplate: Language
}

function usePublishedCodeSnippet({
  codeSnippetID,
  insertedCodeSnippetIDs = [],
}: Props) {
  let url = `https://embed.usedevbook.com/${codeSnippetID}/props`
  if (insertedCodeSnippetIDs.length > 0) {
    url += insertedCodeSnippetIDs.join(',')
  }

  const { data } = useFetch<PublishedCodeSnippet>(url)

  return useMemo(() => {
    if (!data) return undefined

    let envVars: EnvVars = {}
    if (typeof data?.codeSnippetEnvVars === 'string') {
      try {
        envVars = JSON.parse(data?.codeSnippetEnvVars)
      } catch (err: any) {
        console.error('Cannot parse env vars', err)
      }
    }

    return {
      ...data,
      codeSnippetEnvVars: envVars
    }
  }, [data])
}

export default usePublishedCodeSnippet
