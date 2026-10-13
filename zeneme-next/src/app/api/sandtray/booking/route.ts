import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { CONTACT_EMAIL } from "@/content/contact"
import { currentUserId } from "@/lib/session"

// 预约专业解读：将用户填写的姓名、邮箱、留言通过 SMTP 发送到 CONTACT_EMAIL。
// SMTP 配置见环境变量 SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM；
// 未配置时返回 503，前端退回为复制邮箱并打开邮件程序。
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const recent = new Map<string, number[]>()

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}))
  const name = str(b.name, 60)
  const email = str(b.email, 120)
  const message = str(b.message, 1000)
  const title = str(b.title, 80)
  const link = str(b.link, 300)
  if (!name || !EMAIL.test(email)) return NextResponse.json({ error: "请填写名字和正确的邮箱" }, { status: 400 })

  // 每人每小时最多 5 封
  const uid = (await currentUserId()) ?? "anon"
  const now = Date.now()
  const hits = (recent.get(uid) ?? []).filter((t) => now - t < 3600_000)
  if (hits.length >= 5) return NextResponse.json({ error: "提交太频繁了，稍后再试" }, { status: 429 })

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return NextResponse.json({ error: "mail-not-configured" }, { status: 503 })

  const port = Number(SMTP_PORT || 465)
  const mailer = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
  try {
    await mailer.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: CONTACT_EMAIL,
      replyTo: `${name} <${email}>`,
      subject: `预约沙盘觉察卡解读 · ${name}${title ? ` · ${title}` : ""}`,
      text: [`名字：${name}`, `邮箱：${email}`, title ? `觉察卡：${title}` : "", link ? `链接：${link}` : "", "", message || "（没有留言）"].filter((x, i) => x !== "" || i === 4).join("\n"),
    })
  } catch {
    return NextResponse.json({ error: "发送失败，稍后再试" }, { status: 502 })
  }
  recent.set(uid, [...hits, now])
  return NextResponse.json({ ok: true })
}
