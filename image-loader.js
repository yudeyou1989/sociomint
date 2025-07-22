/**
 * 自定义图片加载器
 * 用于静态导出模式下的图片优化
 */

export default function imageLoader({ src, width, quality }) {
  // 如果是外部URL，直接返回
  if (src.startsWith('http')) {
    return src;
  }
  
  // 如果是本地图片，添加优化参数
  const params = new URLSearchParams();
  
  if (width) {
    params.set('w', width.toString());
  }
  
  if (quality) {
    params.set('q', quality.toString());
  }
  
  // 对于静态导出，直接返回原始路径
  return `${src}${params.toString() ? `?${params.toString()}` : ''}`;
}
