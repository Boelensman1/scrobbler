const sanitizeTitle = (videoTitle: string): string => {
  // Remove [genre] or 【genre】 from the beginning of the title
  let title = videoTitle.replace(/^((\[[^\]]+])|(【[^】]+】))\s*-*\s*/i, '')

  // Remove track (CD and vinyl) numbers from the beginning of the title
  title = title.replace(/^\s*([a-zA-Z]{1,2}|[0-9]{1,2})[1-9]?\.\s+/i, '')

  // Remove - preceding opening bracket
  title = title.replace(/-\s*([「【『])/, '$1')

  // 【/(*Music Video/MV/PV*】/)
  title = title.replace(/[(【].*?((MV)|(PV)).*?[】)]/i, '')

  // 【/(*Perf./performance ver./version/video*】/)
  title = title.replace(
    /[(【][^(【]*?(performance|perf\.?) *(vers\.?|version|video)([】)])/i,
    '',
  )

  // 【/(東方/オリジナル*】/)
  title = title.replace(/[(【]((オリジナル)|(東方)).*?[】)]/, '')

  // MV/PV if followed by an opening/closing bracket
  title = title.replace(/(MV|PV)([「【『』】」])/i, '$2')

  // MV/PV if ending and with whitespace in front
  title = title.replace(/\s+(MV|PV)$/i, '')

  return title
}

export default sanitizeTitle
