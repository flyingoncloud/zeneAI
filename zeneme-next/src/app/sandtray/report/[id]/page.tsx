import Link from "next/link"
import { Screen } from "@/components/layout/Screen"
import { ReportCard } from "@/components/report/ReportCard"
import { AnalyzeButton } from "@/components/report/AnalyzeButton"
import { getCopy } from "@/lib/lang"
import { store } from "@/lib/db"
import { currentUserId } from "@/lib/session"
import { CONTACT_EMAIL } from "@/content/contact"
import { BookExpert } from "@/components/report/BookExpert"

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const copy = await getCopy()
  const { id } = await params
  const uid = await currentUserId()
  const record = uid ? await store.get(uid, id) : null

  return (
    <Screen title={copy.report.title} back="/" decorated headerClassName="bg-white" className="p-3 md:px-8 md:py-8">
      {!record ? (
        <p className="py-24 text-center text-sm text-ink-muted">{copy.ui.notFound}</p>
      ) : record.report ? (
        <>
          <ReportCard report={record.report} snapshotUrl={record.snapshotUrl} seed={record.id} name={record.name} />
          <div className="mx-auto w-full max-w-[440px] lg:max-w-[900px]">
            <p className="px-3 pt-4 text-xs text-ink-muted md:px-1">*{copy.global.reportDisclaimer}</p>
            <div className="mt-4 rounded-2xl bg-white px-4 py-4 ring-1 ring-[#e3ece6] md:flex md:items-center md:gap-6 md:px-6">
              <div className="md:flex-1">
                <p className="text-sm font-semibold text-foreground">{copy.report.expert.title}</p>
                <p className="mt-1 text-[13px] leading-6 text-ink-muted">{copy.report.expert.body}</p>
                <p className="mt-1 text-[13px] text-brand-dark select-all">{CONTACT_EMAIL}</p>
              </div>
              <BookExpert title={record.report.title} />
            </div>
            <Link
              href="/sandtray/start"
              className="mt-4 mb-2 flex h-11 w-full items-center justify-center rounded-[21px] bg-brand-dark text-base font-semibold text-white md:mx-auto md:w-60"
            >
              {copy.report.again}
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-24">
          <p className="text-sm text-ink-muted">{copy.ui.noReport}</p>
          <AnalyzeButton id={record.id} />
        </div>
      )}
    </Screen>
  )
}
