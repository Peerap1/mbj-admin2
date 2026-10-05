# Typography

Application typography is defined in `src/index.css`. Use these CSS variables in
stylesheets and React styles instead of literal sizes or text colors.

| Role                            | Variable         | Size |
| ------------------------------- | ---------------- | ---- |
| Captions and badges             | `--text-caption` | 12px |
| Supporting text and labels      | `--text-small`   | 13px |
| Tables, navigation and controls | `--text-control` | 14px |
| Body text                       | `--text-body`    | 15px |
| Section headings                | `--text-section` | 18px |
| Secondary titles                | `--text-title`   | 20px |
| Page headings                   | `--text-page`    | 24px |
| Large statistics                | `--text-display` | 28px |

Use Sarabun through `--font-body` and `--font-heading`. Use `--text-primary`
for content, `--text-heading` for headings, `--text-secondary` for labels,
and `--text-muted` for supporting information. Use `--text-inverse` on dark
backgrounds, `--primary` for links and highlights, and `--text-success`,
`--text-warning`, or `--text-danger` for status text.

The standalone print document in `src/features/sales/slipPrint.js` has its own
compact typography for paper output.
