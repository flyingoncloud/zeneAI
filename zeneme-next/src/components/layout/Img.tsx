import NextImage, { type ImageProps } from "next/image"
import { withBase } from "@/lib/base-path"

// next/image 只给 /_next/image 路由加 basePath，不会给 url 参数里的图片路径加，
// 所以部署在子路径下时图片一律 400。全站的图片都走这个包装。
export function Img({ src, ...rest }: ImageProps) {
  return <NextImage {...rest} src={typeof src === "string" ? withBase(src) : src} />
}
