@import "tailwindcss";

@theme {
  --color-theme-lightest: var(--theme-lightest);
  --color-theme-light-mid: var(--theme-light-mid);
  --color-theme-mid: var(--theme-mid);
  --color-theme-darkest: var(--theme-darkest);
}

@layer base {
  :root {
    --theme-lightest: #EDF1D6;
    --theme-light-mid: #9DC08B;
    --theme-mid: #609966;
    --theme-darkest: #40513B;
  }
  
  .theme-blue {
    --theme-lightest: #BBE1FA;
    --theme-light-mid: #3282B8;
    --theme-mid: #0F4C75;
    --theme-darkest: #1B262C;
  }
  
  .theme-brown {
    --theme-lightest: #F4DFBA;
    --theme-light-mid: #EEC373;
    --theme-mid: #CA965C;
    --theme-darkest: #876445;
  }

  body {
    background-color: var(--theme-lightest);
    color: var(--theme-darkest);
    transition: background-color 0.3s ease, color 0.3s ease;
  }
}

@layer utilities {
  .grid-bg {
    background-image: 
      linear-gradient(to right, color-mix(in srgb, var(--theme-darkest) 8%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--theme-darkest) 8%, transparent) 1px, transparent 1px);
    background-size: 40px 40px;
  }
}
