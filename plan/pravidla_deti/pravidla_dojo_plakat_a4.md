<style>
  @page {
    size: A4;
    margin: 10mm;
  }

  body {
    font-family: "Arial", "Helvetica", sans-serif;
    color: #14213d;
  }

  .poster {
    min-height: 275mm;
    border: 4px solid #14213d;
    border-radius: 22px;
    padding: 14mm 12mm 12mm;
    background: linear-gradient(180deg, #fff8e8 0%, #ffffff 20%, #eef6ff 100%);
    box-sizing: border-box;
  }

  .eyebrow {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 999px;
    background: #14213d;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 8px;
  }

  .header-copy {
    flex: 1;
    min-width: 0;
  }

  .logo {
    width: 54px;
    height: 54px;
    object-fit: cover;
    border-radius: 14px;
    border: 3px solid #14213d;
    background: #ffffff;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .title {
    font-size: 30px;
    line-height: 1.05;
    font-weight: 900;
    margin: 0 0 6px;
    color: #c1121f;
    text-transform: uppercase;
  }

  .subtitle {
    font-size: 16px;
    line-height: 1.35;
    font-weight: 700;
    margin: 0 0 14px;
  }

  .lead-box {
    background: #14213d;
    color: #ffffff;
    border-radius: 16px;
    padding: 10px 14px;
    margin-bottom: 14px;
    font-size: 15px;
    line-height: 1.35;
    font-weight: 700;
  }

  .rules {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }

  .rule {
    border-radius: 18px;
    padding: 12px;
    min-height: 88px;
    box-sizing: border-box;
  }

  .rule-1 { background: #fde2e4; }
  .rule-2 { background: #fff1c9; }
  .rule-3 { background: #d9f2e6; }
  .rule-4 { background: #dcebff; }
  .rule-5 { background: #efe3ff; }

  .rule-number {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #14213d;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 900;
    margin-bottom: 8px;
  }

  .rule-title {
    font-size: 18px;
    line-height: 1.15;
    font-weight: 900;
    margin: 0 0 4px;
  }

  .rule-text {
    font-size: 14px;
    line-height: 1.28;
    margin: 0;
    font-weight: 700;
  }

  .bottom {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 10px;
    margin-top: 4px;
  }

  .panel {
    border-radius: 18px;
    padding: 12px 14px;
    box-sizing: border-box;
  }

  .good {
    background: #d9f2e6;
  }

  .calm {
    background: #fff1c9;
  }

  .panel-title {
    font-size: 16px;
    font-weight: 900;
    text-transform: uppercase;
    margin: 0 0 8px;
  }

  .panel ul,
  .panel ol {
    margin: 0;
    padding-left: 18px;
    font-size: 14px;
    line-height: 1.35;
    font-weight: 700;
  }

  .footer {
    margin-top: 12px;
    text-align: center;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 1px;
    color: #14213d;
    text-transform: uppercase;
  }
</style>

<div class="poster">
  <div class="header">
    <div class="header-copy">
      <div class="eyebrow">Okinawa Shorin-ryu • dětské dojo</div>
      <h1 class="title">Pravidla Dojo</h1>
      <p class="subtitle">V dojo chci být dobrý parťák. Chci cvičit, zlepšovat se a pomáhat celé skupině.</p>
    </div>
    <img class="logo" src="https://www.shuri-te.cz/photo/editor/cfokk0-copy-768x768.jpg" alt="Logo dojo">
  </div>

  <div class="lead-box">Když trenér mluví nebo dá signál, všichni hned zastaví, ztiší se a dívají se.</div>

  <div class="rules">
    <div class="rule rule-1">
      <div class="rule-number">1</div>
      <h2 class="rule-title">Poslouchám</h2>
      <p class="rule-text">Když trenér mluví, stojím a poslouchám.</p>
    </div>
    <div class="rule rule-2">
      <div class="rule-number">2</div>
      <h2 class="rule-title">Zastavím hned</h2>
      <p class="rule-text">Po signálu hned zastavím a dívám se na trenéra.</p>
    </div>
    <div class="rule rule-3">
      <div class="rule-number">3</div>
      <h2 class="rule-title">Cvičím bezpečně</h2>
      <p class="rule-text">Nemlátím kolem sebe a nestrkám do ostatních.</p>
    </div>
    <div class="rule rule-4">
      <div class="rule-number">4</div>
      <h2 class="rule-title">Neruším druhé</h2>
      <p class="rule-text">Každý má právo dobře trénovat a soustředit se.</p>
    </div>
    <div class="rule rule-5" style="grid-column: 1 / span 2; min-height: 72px;">
      <div class="rule-number">5</div>
      <h2 class="rule-title">Chovám se s respektem</h2>
      <p class="rule-text">K trenérovi, k dětem i k dojo.</p>
    </div>
  </div>

  <div class="bottom">
    <div class="panel good">
      <h3 class="panel-title">Když pravidla držím</h3>
      <ul>
        <li>můžu dobře cvičit,</li>
        <li>zlepšuju se,</li>
        <li>pomáhám celé skupině,</li>
        <li>trénink nás víc baví.</li>
      </ul>
    </div>
    <div class="panel calm">
      <h3 class="panel-title">Když zlobím</h3>
      <ol>
        <li>trenér mě upozorní,</li>
        <li>chvíli necvičím,</li>
        <li>vrátím se, až jsem v klidu.</li>
      </ol>
    </div>
  </div>

  <div class="footer">Klid • Respekt • Bezpečí • Soustředění</div>
</div>
