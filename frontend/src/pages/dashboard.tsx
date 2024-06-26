// pages/dashboard.tsx
import requireAuth from '../utils/requireAuth'
import LayoutAuthenticated from '../layouts/Authenticated'
import { ReactElement } from 'react'
import SectionMain from '../components/Section/Main'
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton'
import { mdiChartTimelineVariant } from '@mdi/js'
import CardBoxWidget from '../components/CardBox/Widget'
import Button from '../components/Button'
import { getPageTitle } from '../config'

const DashboardPage = () => {
  return (
    <>
        <title>{getPageTitle('Dashboard')}</title>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiChartTimelineVariant} title="Dashboard Overview" main>
          <Button
            href="https://github.com/NerdyNot/RunAIOps"
            target="_blank"
            label="Star on GitHub"
            color="contrast"
            roundedFull
            small
          />
        </SectionTitleLineWithButton>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
          {/* Your widgets go here */}
        </div>
      </SectionMain>
    </>
  )
}

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>
}

export default requireAuth(DashboardPage)
