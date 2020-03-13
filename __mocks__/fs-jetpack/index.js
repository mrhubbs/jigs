const mockFileSystem = {
  'src/layouts/layout.html': `---
title: Title
---

<div>
  <!-- jigs-page-contents -->
</div>`,

  'src/layouts/i-have-bad-front-matter.html': `---
--

<span></span>`,

  'src/layouts/i-have-bad-insertion-point.html': `---
---

<span>
<!-- not jigs-page-contents -->
</span>`,

  'src/layouts/basepage.html': `---
title: basepage - replace this!
---

<div>
<!-- jigs-page-contents -->
</div>`
}

module.exports = {
  readAsync(filePath) {
    return new Promise((res, rej) => {
      const file = mockFileSystem[filePath]

      if (file === undefined) {
        rej(new Error(`No such file as: ${filePath}`))
      } else {
        res(file)
      }
    })
  },
  // DUMB implementation
  inspect(filePath, options) {
    return {
      modifyTime: null
    }
  }
}
