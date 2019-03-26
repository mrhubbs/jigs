# Techniques

Things I'm learning which I intend to incorporate into my workflow.

## Responsive: Scaling Focused

We'll be able to handle the "pressure point" (transition from mobile to desktop screen size) better if we scale many things (margins, padding, text, etc.) in addition to breakpoints.

### How to Do It

Example:

```css
h1 {
  font-size: calc(1.3em + 1.6vmin + .4vw);
}
```

What this does...

  - We give a base size with the `em` units.
  - The `vw` multiplier increases the font size as the screen gets bigger (mobile to desktop).
  - The `vmin` multiplier stabilizes the screen width scaling. It stabilizes because it has more weight. It prevents the size from ranging from huge to tiny. It's a better stabilizer than the `em`, because it changes some with screen size.
