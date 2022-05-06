import {
  useState,
  useEffect,
  useCallback,
} from 'react'
import { useRouter } from 'next/router'
import {
  getUser,
  withAuthRequired,
  supabaseServerClient,
} from '@supabase/supabase-auth-helpers/nextjs'

import type { CodeSnippet } from 'types'
import { showErrorNotif } from 'utils/notification'
import { tabs, Tab } from 'utils/newCodeSnippetTabs'
import NewCodeSnippetContent from 'components/NewCodeSnippetContent'
import TitleLink from 'components/TitleLink'
import Title from 'components/typography/Title'
import Text from 'components/typography/Text'
import Button from 'components/Button'
import ButtonLink from 'components/ButtonLink'

export const getServerSideProps = withAuthRequired({
  redirectTo: '/signin',
  async getServerSideProps(ctx) {
    try {
      const { user } = await getUser(ctx)
      const { tab, slug }: { tab?: string, slug?: string } = ctx.query

      // Try to get a code snippet from the DB based on the slug.
      const { data, error } = await supabaseServerClient(ctx)
        .from<CodeSnippet>('code_snippets')
        .select('*')
        .eq('slug', slug)
        // Check if the user is the owner of a code snippet.
        .eq('creator_id', user!.id)

      if (error) {
        return {
          props: {
            error: error.message,
          }
        }
      } else if (!data.length) {
        return {
          notFound: true,
        }
      }

      const codeSnippet = data[0]

      // Redirect user to the `?tab=code` if no valid tab query is present.
      if (!tab || !Object.entries(tabs).find(([key, val]) => val.key === tab)) {
        return {
          redirect: {
            destination: `/dashboard/${slug}/edit?tab=${tabs.code.key}`,
            permanent: false,
          },
          props: {
            codeSnippet,
          },
        }
      }

      return {
        props: {
          codeSnippet,
        },
      }
    } catch (err: any) {
      return {
        props: {
          error: err.message,
        }
      }
    }
  }
})

interface Props {
  codeSnippet: CodeSnippet
  error?: string
}

async function upsertCodeSnippet(cs: CodeSnippet) {
  const response = await fetch('/api/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cs)
  })
  return response.json()
}

function CodeSnippetEditor({ codeSnippet, error }: Props) {
  const [code, setCode] = useState(codeSnippet.code || '')
  const [title, setTitle] = useState(codeSnippet.title)

  const router = useRouter()
  const slug = router.query.slug || []

  const currentTab = router.query.tab

  useEffect(function checkForError() {
    if (error) {
      showErrorNotif(`Error: ${error}`)
    }
  }, [error])

  const handleCodeChange = useCallback(async (c: string) => {
    setCode(c)

    const newCS = {
      ...codeSnippet,
      code: c,
    }
    const j = await upsertCodeSnippet(newCS)
    console.log({j})
  }, [setCode, codeSnippet])

  const handleTitleChange = useCallback(async (t: string) => {
    setTitle(t)

    if (!t) return
    const newCS = {
      ...codeSnippet,
      title: t,
      slug: `${t.replace(/\s+/g, '-').toLowerCase()}-${codeSnippet.id}`,
    }
    const j = await upsertCodeSnippet(newCS)
    router.replace(`/${newCS.slug}/edit?tab=code`)
    console.log({j})
  }, [setTitle, codeSnippet])

  return (
    <>
      {error && (
        <div className="
          flex
          flex-col
          items-center
          space-y-16

          py-6

          w-full
          bg-transparent
          border
          border-black-700
          rounded-lg
        ">
          <Title
            title="Something went wrong"
            size={Title.size.T2}
          />
          <Text
            text={error}
          />
          <ButtonLink
            href="/dashboard"
            text="Go Home"
          />
        </div>
      )}
      {!error && (
        <div className="
          flex-1
          flex
          flex-col
          space-y-6
        ">
          <div className="
            flex
            items-center
            space-x-2
            min-h-[48px]
          ">
             <TitleLink
               href="/dashboard"
               title="Code Snippets"
             />
             <Title title="/"/>
             <Title title="Edit"/>
          </div>

          <div className="
            flex-1
            flex
            flex-col
            space-y-4
            md:flex-row
            md:space-y-0
            md:space-x-4
          ">
            <div className="
              flex
              flex-row
              items-center
              justify-start
              space-x-4
              md:flex-col
              md:items-start
              md:space-x-0
              md:space-y-4
            ">
              {Object.entries(tabs).map(([key, val]) => (
                <TitleLink
                  key={val.key}
                  href={`/dashboard/${codeSnippet.slug}/edit?tab=${val.key}`}
                  title={val.title}
                  icon={val.icon}
                  size={TitleLink.size.T3}
                  active={val.key === currentTab}
                  shallow
                />
              ))}
            </div>

            <NewCodeSnippetContent
              code={code}
              title={title}
              onCodeChange={handleCodeChange}
              onTitleChange={handleTitleChange}
            />

            <div className="
              hidden
              lg:flex
              lg:flex-col
              lg:items-start
              lg:space-y-4
            ">
              <Text
                text="URL will go here"
              />
              <Text
                text="Embed will go here"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CodeSnippetEditor