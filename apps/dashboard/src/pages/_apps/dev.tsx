import { GetServerSideProps } from 'next'
import getRawBody from 'raw-body'

import AppPage from 'components/AppPage'
import {
  CompiledAppContent,
  compileContent,
  AppContentJSON,
} from 'apps/content'

// TODO: Add realtime reloading on changes
// https://dev.to/cassiolacerda/automatically-refresh-the-browser-on-node-express-server-changes-x1f680-1k0o#comment-1kjdg
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  // TODO: Check the cached requests validity
  context.res.setHeader(
    'Cache-Control',
    'maxage'
  )

  // Info about using body and POST request for Nextjs pages:
  // https://github.com/vercel/next.js/discussions/12152
  const body = await getRawBody(context.req)
  const stringBody = body.toString()
  const appContent = JSON.parse(stringBody) as AppContentJSON

  const content = await compileContent(appContent)

  return {
    props: {
      content,
    }
  }
}

export interface Props {
  content: CompiledAppContent
}

function DevApp({ content }: Props) {
  return <AppPage content={content} />
}

export default DevApp