import { expect, test } from "@playwright/test";

const recipePath = "/recipes/polpo-sous-vide";
const shareStorageKey = "danio-cooks-chat-share-v1";

async function openChatAndAcceptConsent(page: import("@playwright/test").Page) {
  await page.goto(recipePath);
  await page.locator(".recipe-chat-trigger").click();
  await page.locator(".chat-consent-accept").click();
}

test("la chat mostra l'indicatore fino al primo token della risposta", async ({ page }) => {
  let releaseResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });

  await page.route("**/api/chat", async (route) => {
    await responseReady;
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: 'data: {"text":"Il polpo cotto va raffreddato rapidamente prima di conservarlo."}\n\n',
    });
  });

  await openChatAndAcceptConsent(page);
  await page.locator("#chat-input").fill("Come conservo il polpo?");
  const chatRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/chat") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Invia domanda" }).click();
  await chatRequestPromise;

  const loadingIndicator = page.locator(".chat-response-loading");
  await expect(loadingIndicator).toBeVisible();
  await expect(loadingIndicator).toContainText("Sto preparando la risposta...");
  await expect(loadingIndicator.locator("svg")).toHaveClass(/spin/);
  await expect(page.locator("#chat-input")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Invia domanda" })).toBeDisabled();

  releaseResponse();

  await expect(loadingIndicator).toHaveCount(0);
  await expect(page.locator(".chat-message-assistant")).toContainText(
    "Il polpo cotto va raffreddato rapidamente prima di conservarlo.",
  );
});

test("la chat sostituisce l'indicatore con l'errore della risposta", async ({ page }) => {
  let releaseResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });

  await page.route("**/api/chat", async (route) => {
    await responseReady;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Il servizio chat non e disponibile." }),
    });
  });

  await openChatAndAcceptConsent(page);
  await page.locator("#chat-input").fill("Come conservo il polpo?");
  const chatRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/chat") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Invia domanda" }).click();
  await chatRequestPromise;

  const loadingIndicator = page.locator(".chat-response-loading");
  await expect(loadingIndicator).toBeVisible();

  releaseResponse();

  await expect(loadingIndicator).toHaveCount(0);
  await expect(page.locator(".chat-message-assistant")).toHaveCount(0);
  await expect(page.locator(".chat-error")).toHaveText("Il servizio chat non e disponibile.");
});

test("il retry reinvia lo stesso messaggio fallito senza duplicarlo e lo converte in inviato quando arriva una risposta", async ({ page }) => {
  let attempt = 0;
  await page.route("**/api/chat", async (route) => {
    attempt += 1;
    if (attempt === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Il servizio chat non e disponibile." }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: 'data: {"text":"Puoi raffreddarlo e conservarlo in frigorifero per poco tempo."}\n\n',
    });
  });

  await openChatAndAcceptConsent(page);
  await page.locator("#chat-input").fill("Come conservo il polpo?");
  await page.getByRole("button", { name: "Invia domanda" }).click();

  const failedBubble = page.locator(".chat-message-user.chat-message-failed");
  await expect(failedBubble).toContainText("Come conservo il polpo?");
  await expect(page.locator(".chat-message-user")).toHaveCount(1);

  const retryRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/chat") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Ritenta invio messaggio" }).click();
  await retryRequestPromise;

  await expect(page.locator(".chat-message-user")).toHaveCount(1);
  await expect(page.locator(".chat-message-user.chat-message-failed")).toHaveCount(0);
  await expect(page.locator(".chat-message-assistant")).toContainText(
    "Puoi raffreddarlo e conservarlo in frigorifero per poco tempo.",
  );
});

test("un retry che fallisce ancora mantiene un solo messaggio fallito visibile", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Il servizio chat non e disponibile." }),
    });
  });

  await openChatAndAcceptConsent(page);
  await page.locator("#chat-input").fill("Come conservo il polpo?");
  await page.getByRole("button", { name: "Invia domanda" }).click();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const retryRequestPromise = page.waitForRequest(
      (request) => request.url().includes("/api/chat") && request.method() === "POST",
    );
    await page.getByRole("button", { name: "Ritenta invio messaggio" }).click();
    await retryRequestPromise;
  }

  await expect(page.locator(".chat-message-user")).toHaveCount(1);
  await expect(page.locator(".chat-message-user.chat-message-failed")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Ritenta invio messaggio" })).toHaveCount(1);
  await expect(page.locator(".chat-error")).toHaveText("Il servizio chat non e disponibile.");
});

test("le risposte assistant renderizzano il markdown invece di mostrare la sintassi letterale", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: 'data: {"text":"**Importante**\\n\\n- Raffredda in fretta\\n- Copri prima del frigo"}\n\n',
    });
  });

  await openChatAndAcceptConsent(page);
  await page.locator("#chat-input").fill("Come conservo il polpo?");
  await page.getByRole("button", { name: "Invia domanda" }).click();

  const assistantMessage = page.locator(".chat-message-assistant").last();
  await expect(assistantMessage.locator("strong")).toHaveText("Importante");
  await expect(assistantMessage.locator("ul li")).toHaveCount(2);
  await expect(assistantMessage).not.toContainText("**Importante**");
});

test("il consenso iniziale della chat menziona la condivisione di default e come disattivarla", async ({ page }) => {
  await page.goto(recipePath);
  await page.locator(".recipe-chat-trigger").click();

  const consent = page.locator(".chat-consent");
  await expect(consent).toBeVisible();
  await expect(consent).toContainText("impostazione predefinita");
  await expect(consent).toContainText("intestazione della chat");
});

test("il pulsante di condivisione nella intestazione e visibile e si attiva o disattiva con un click", async ({ page }) => {
  await openChatAndAcceptConsent(page);

  const toggle = page.locator(".chat-share-toggle");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), shareStorageKey))
    .toBe("opted-out");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), shareStorageKey))
    .toBeNull();
});

test("chiudere la chat invia i segnali senza bloccare la interfaccia e avanza il puntatore n su n+1", async ({ page }) => {
  const slug = "polpo-sous-vide";
  await page.route("**/api/chat", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "La chat non e configurata sul server." }),
  }));
  await openChatAndAcceptConsent(page);

  await page.locator("#chat-input").fill("Quanto dura in frigo il polpo cotto?");
  const chatRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/chat") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Invia domanda" }).click();
  await chatRequestPromise;

  await expect(page.locator(".chat-message-user").first()).toContainText("Quanto dura in frigo il polpo cotto?");
  // La chat esistente non ha regressioni: il messaggio di errore viene mostrato senza rompere la interfaccia.
  await expect(page.locator(".chat-error")).toContainText("La chat non e configurata sul server.");

  const completeRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/complete") && request.method() === "POST",
  );

  const closeStartedAt = Date.now();
  await page.locator(".dialog-close").click();
  await expect(page.locator(".chat-dialog")).toHaveCount(0);
  const closeElapsedMs = Date.now() - closeStartedAt;
  expect(closeElapsedMs).toBeLessThan(500);

  const completeRequest = await completeRequestPromise;
  const payload = completeRequest.postDataJSON() as {
    slug: string;
    messages: Array<{ role: string; content: string }>;
  };
  expect(payload.slug).toBe(slug);
  expect(payload.messages).toHaveLength(1);
  expect(payload.messages[0]).toEqual({ role: "user", content: "Quanto dura in frigo il polpo cotto?" });

  const sentUpto = await page.evaluate(
    (s) => window.localStorage.getItem(`danio-cooks-chat-sent-upto:recipe:${s}`),
    slug,
  );
  expect(sentUpto).toBe("1");
});

test("chiudere la chat ritenta /api/complete fino al primo successo e interrompe il ciclo", async ({ page }) => {
  const slug = "polpo-sous-vide";
  let completeAttempts = 0;

  await page.route("**/api/chat", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "La chat non e configurata sul server." }),
  }));

  await page.route("**/api/complete", async (route) => {
    completeAttempts += 1;
    await route.fulfill({
      status: completeAttempts < 3 ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await openChatAndAcceptConsent(page);
  await page.locator("#chat-input").fill("Quanto dura in frigo il polpo cotto?");
  await page.getByRole("button", { name: "Invia domanda" }).click();
  await expect(page.locator(".chat-error")).toContainText("La chat non e configurata sul server.");

  await page.evaluate(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler, timeout, ...args) => nativeSetTimeout(
      handler,
      timeout === 15_000 ? 10 : timeout,
      ...args,
    )) as typeof window.setTimeout;
  });

  await page.locator(".dialog-close").click();
  await expect(page.locator(".chat-dialog")).toHaveCount(0);

  await expect.poll(() => completeAttempts).toBe(3);
  await page.waitForTimeout(80);
  expect(completeAttempts).toBe(3);

  const sentUpto = await page.evaluate(
    (s) => window.localStorage.getItem(`danio-cooks-chat-sent-upto:recipe:${s}`),
    slug,
  );
  expect(sentUpto).toBe("1");
});

test("disattivare la condivisione impedisce che i segnali vengano inviati alla chiusura della chat", async ({ page }) => {
  const slug = "polpo-sous-vide";
  await openChatAndAcceptConsent(page);

  await page.locator(".chat-share-toggle").click();
  await expect(page.locator(".chat-share-toggle")).toHaveAttribute("aria-pressed", "false");

  await page.locator("#chat-input").fill("Che temperatura serve per la vasca?");
  const chatRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/chat") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Invia domanda" }).click();
  await chatRequestPromise;

  let completeRequestSeen = false;
  page.on("request", (request) => {
    if (request.url().includes("/api/complete")) completeRequestSeen = true;
  });

  await page.locator(".dialog-close").click();
  await expect(page.locator(".chat-dialog")).toHaveCount(0);
  await page.waitForTimeout(300);

  expect(completeRequestSeen).toBe(false);
  const sentUpto = await page.evaluate(
    (s) => window.localStorage.getItem(`danio-cooks-chat-sent-upto:recipe:${s}`),
    slug,
  );
  expect(sentUpto).toBeNull();
});

test("il toggle di condivisione mostra un toast esplicativo, annunciato via aria-live, che scompare da solo", async ({ page }) => {
  await openChatAndAcceptConsent(page);

  const toggle = page.locator(".chat-share-toggle");
  const toast = page.locator(".chat-share-toast");
  await expect(toast).toHaveAttribute("aria-live", "polite");

  await toggle.click();
  await expect(toast).toContainText(
    "Condivisione disattivata: le prossime sessioni non verranno piu analizzate per migliorare le ricette.",
  );
  await expect(toast).toBeVisible();

  // Click successivo prima dell'auto-dismiss: il testo si aggiorna senza timer sovrapposti.
  await toggle.click();
  await expect(toast).toContainText(
    "Condivisione attivata: condividiamo un estratto delle sessioni per migliorare le ricette.",
  );
  await expect(toast).toBeVisible();

  await expect(toast).not.toBeVisible({ timeout: 7000 });
});

test("una cronologia locale piu vecchia di 10 giorni viene scartata insieme al puntatore n su n+1", async ({ page }) => {
  const slug = "polpo-sous-vide";
  const staleSavedAt = Date.now() - 11 * 24 * 60 * 60 * 1000;
  const historyKey = `danio-cooks-chat:recipe:${slug}`;
  const sentUptoStorageKey = `danio-cooks-chat-sent-upto:recipe:${slug}`;

  // La cronologia va iniettata dopo che la pagina e gia caricata (non con addInitScript prima
  // della navigazione): in dev, Fast Refresh puo ricompilare ed eseguire di nuovo gli init
  // script su una route visitata per la prima volta, riscrivendo il valore stantio dopo che
  // l'app l'ha gia scartato. Iniettiamo quindi via page.evaluate su pagina stabile e poi
  // ricarichiamo, cosi il mount dell'app legge davvero il valore scaduto una sola volta.
  await page.goto(recipePath);
  await page.evaluate(
    ({ historyKey: key, sentUptoStorageKey: sentUptoKey, savedAt }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({ savedAt, messages: [{ role: "user", content: "Domanda di 11 giorni fa" }] }),
      );
      window.localStorage.setItem(sentUptoKey, "1");
    },
    { historyKey, sentUptoStorageKey, savedAt: staleSavedAt },
  );
  await page.reload();

  await page.locator(".recipe-chat-trigger").click();
  await page.locator(".chat-consent-accept").click();

  await expect(page.locator(".chat-empty")).toBeVisible();
  await expect(page.locator(".chat-message")).toHaveCount(0);

  const storedHistory = await page.evaluate((key) => window.localStorage.getItem(key), historyKey);
  const storedSentUpto = await page.evaluate((key) => window.localStorage.getItem(key), sentUptoStorageKey);
  expect(storedHistory).toBeNull();
  expect(storedSentUpto).toBeNull();
});

test("la pagina privacy descrive la nuova finalita di condivisione dei segnali di feedback", async ({ page }) => {
  await page.goto("/privacy");

  await expect(
    page.getByRole("heading", { level: 2, name: "Segnali di feedback dalle sessioni chat" }),
  ).toBeVisible();

  const article = page.locator("article.legal-content");
  await expect(article).toContainText("legittimo interesse");
  await expect(article).toContainText("10 giorni");
  await expect(article).toContainText("intestazione della chat");
  await expect(article).toContainText("10 giorni di inattivita");
});

test("il pulsante salva sessione è disabilitato senza messaggi e abilitato quando ci sono messaggi", async ({ page }) => {
  await page.route("**/api/chat", (route) => route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    body: 'data: {"text":"Risposta di prova."}\n\n',
  }));

  await openChatAndAcceptConsent(page);

  const saveButton = page.getByRole("button", { name: "Salva sessione per l'analisi" });
  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeDisabled();

  await page.locator("#chat-input").fill("Quanto tempo di cottura?");
  await page.getByRole("button", { name: "Invia domanda" }).click();
  await expect(page.locator(".chat-message-assistant")).toContainText("Risposta di prova.");

  await expect(saveButton).toBeEnabled();
});

test("il pulsante salva sessione invia POST /api/complete con i messaggi della sessione", async ({ page }) => {
  const slug = "polpo-sous-vide";

  await page.route("**/api/chat", (route) => route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    body: 'data: {"text":"Puoi cuocerlo per 4 ore a 75 gradi."}\n\n',
  }));

  await page.route("**/api/complete", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ schema_version: "2", recipe_slug: slug, date_bucket: "2026-08-20", session_ref: "abc", has_pii_risk: false, redaction_notes: null, signals: [] }),
  }));

  await openChatAndAcceptConsent(page);
  await page.locator("#chat-input").fill("Quanto tempo di cottura serve?");
  await page.getByRole("button", { name: "Invia domanda" }).click();
  await expect(page.locator(".chat-message-assistant")).toContainText("Puoi cuocerlo per 4 ore a 75 gradi.");

  const completeRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/complete") && request.method() === "POST",
  );

  await page.getByRole("button", { name: "Salva sessione per l'analisi" }).click();

  const completeRequest = await completeRequestPromise;
  const payload = completeRequest.postDataJSON() as {
    slug: string;
    messages: Array<{ role: string; content: string }>;
  };

  expect(payload.slug).toBe(slug);
  expect(payload.messages.length).toBeGreaterThanOrEqual(2);
  expect(payload.messages[0]).toMatchObject({ role: "user", content: "Quanto tempo di cottura serve?" });
  expect(payload.messages[1]).toMatchObject({ role: "assistant", content: "Puoi cuocerlo per 4 ore a 75 gradi." });
});

test("il pulsante Database invia esattamente gli ultimi 40 messaggi solo con la condivisione attiva", async ({ page }) => {
  const slug = "polpo-sous-vide";
  const historyKey = `danio-cooks-chat:recipe:${slug}`;
  const messages = Array.from({ length: 45 }, (_, index) => ({
    id: `seed-${index + 1}`,
    role: "user",
    content: `Domanda ${index + 1}`,
    delivery: "sent",
  }));

  await page.route("**/api/complete", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true }),
  }));

  // [P-013] Il seed è scritto dopo la navigazione iniziale e letto dopo reload,
  // evitando che Fast Refresh riscriva localStorage durante il test.
  await page.goto(recipePath);
  await page.evaluate(({ key, seededMessages }) => {
    window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), messages: seededMessages }));
  }, { key: historyKey, seededMessages: messages });
  await page.reload();

  await page.locator(".recipe-chat-trigger").click();
  await page.locator(".chat-consent-accept").click();

  const saveButton = page.locator(".chat-save-trigger");
  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeEnabled();

  const completeRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/complete") && request.method() === "POST",
  );
  await saveButton.click();

  const payload = (await completeRequestPromise).postDataJSON() as {
    slug: string;
    kind: string;
    messages: Array<{ role: string; content: string }>;
  };
  expect(payload).toMatchObject({ slug, kind: "recipe" });
  expect(payload.messages).toEqual(messages.slice(-40).map(({ role, content }) => ({ role, content })));

  await page.locator(".chat-share-toggle").click();
  await expect(page.locator(".chat-share-toggle")).toHaveAttribute("aria-pressed", "false");
  await expect(saveButton).toHaveCount(0);

  await page.locator(".chat-share-toggle").click();
  await expect(page.locator(".chat-share-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect(saveButton).toBeVisible();
});

test("la chiusura limita a 40 messaggi il payload automatico della sessione", async ({ page }) => {
  const slug = "polpo-sous-vide";
  const historyKey = `danio-cooks-chat:recipe:${slug}`;
  const messages = Array.from({ length: 41 }, (_, index) => ({
    id: `seed-${index + 1}`,
    role: "user",
    content: `Domanda ${index + 1}`,
    delivery: "sent",
  }));

  await page.route("**/api/complete", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true }),
  }));

  // [P-013] Il seed avviene dopo goto e prima di reload per non essere sovrascritto
  // da Fast Refresh durante la prima navigazione in sviluppo.
  await page.goto(recipePath);
  await page.evaluate(({ key, seededMessages }) => {
    window.localStorage.setItem("danio-cooks-chat-consent-v1", "accepted");
    window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), messages: seededMessages }));
  }, { key: historyKey, seededMessages: messages });
  await page.reload();

  await page.locator(".recipe-chat-trigger").click();
  const completeRequestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/complete") && request.method() === "POST",
  );
  await page.locator(".dialog-close").click();

  const payload = (await completeRequestPromise).postDataJSON() as {
    slug: string;
    kind: string;
    messages: Array<{ role: string; content: string }>;
  };
  expect(payload).toMatchObject({ slug, kind: "recipe" });
  expect(payload.messages).toHaveLength(40);
  expect(payload.messages[0]).toMatchObject({ role: "user", content: "Domanda 2" });
  expect(payload.messages.at(-1)).toMatchObject({ role: "user", content: "Domanda 41" });
});

test("il pulsante salva sessione non è visibile dopo aver disattivato la condivisione", async ({ page }) => {
  await openChatAndAcceptConsent(page);

  await expect(page.getByRole("button", { name: "Salva sessione per l'analisi" })).toBeVisible();

  await page.locator(".chat-share-toggle").click();
  await expect(page.locator(".chat-share-toggle")).toHaveAttribute("aria-pressed", "false");

  await expect(page.getByRole("button", { name: "Salva sessione per l'analisi" })).toHaveCount(0);
});

// ─── issue #1: sentUpto deve essere scritto PRIMA del fetch ───────────────────
// Se sentUpto viene scritto solo dopo il completamento del fetch, chiudere la
// chat (che chiama sendPendingFeedback) durante un salvataggio manuale in volo
// duplicherebbe gli stessi messaggi perché sendPendingFeedback legge il vecchio
// sentUpto e calcola di nuovo tutti i messaggi come "pending".
test("il salvataggio manuale scrive sentUpto prima del fetch così chiudere la chat non duplica i messaggi", async ({ page }) => {
  const slug = "polpo-sous-vide";

  let releaseComplete!: () => void;
  const completeHeld = new Promise<void>((resolve) => { releaseComplete = resolve; });
  let completeCallCount = 0;

  await page.route("**/api/chat", (route) => route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    body: 'data: {"text":"Puoi cuocerlo per 4 ore a 75 gradi."}\n\n',
  }));

  await page.route("**/api/complete", async (route) => {
    completeCallCount += 1;
    await completeHeld;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  await openChatAndAcceptConsent(page);
  await page.locator("#chat-input").fill("Quanto tempo di cottura?");
  await page.getByRole("button", { name: "Invia domanda" }).click();
  await expect(page.locator(".chat-message-assistant")).toContainText("Puoi cuocerlo per 4 ore a 75 gradi.");

  // Avvia il salvataggio manuale (fetch in volo, bloccato da completeHeld)
  await Promise.all([
    page.waitForRequest((r) => r.url().includes("/api/complete") && r.method() === "POST"),
    page.getByRole("button", { name: "Salva sessione per l'analisi" }).click(),
  ]);

  // Verifica che sentUpto sia già scritto in localStorage PRIMA che il fetch si completi
  const sentUptoDuringFlight = await page.evaluate(
    (s) => window.localStorage.getItem(`danio-cooks-chat-sent-upto:recipe:${s}`),
    slug,
  );
  // 2 messaggi: 1 user + 1 assistant
  expect(sentUptoDuringFlight).toBe("2");

  // Chiude la chat mentre il fetch è ancora in volo: sendPendingFeedback deve vedere
  // sentUpto=2 e 0 messaggi pending, quindi NON fare una seconda chiamata a /api/complete.
  await page.locator(".dialog-close").click();
  await expect(page.locator(".chat-dialog")).toHaveCount(0);

  // Sblocca il fetch in volo e aspetta che si risolva
  releaseComplete();
  await page.waitForTimeout(300);

  // sendPendingFeedback non deve aver fatto una seconda chiamata perché sentUpto era già aggiornato
  expect(completeCallCount).toBe(1);
});

// ─── issue #2: riaprire la chat non deve applicare stato stale al ritorno ─────
// Senza il generation guard, la callback post-await di handleSaveSignals poteva
// chiamare setSaveSignalsStatus("done"/"error") e creare un nuovo timer non
// tracciato anche dopo che openChat() aveva già resettato lo stato a "idle".
test("riaprire la chat mentre un salvataggio manuale è in volo non applica stato stale al ritorno", async ({ page }) => {
  let releaseComplete!: () => void;
  const completeHeld = new Promise<void>((resolve) => { releaseComplete = resolve; });

  await page.route("**/api/chat", (route) => route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    body: 'data: {"text":"Risposta di prova."}\n\n',
  }));

  await page.route("**/api/complete", async (route) => {
    await completeHeld;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  await openChatAndAcceptConsent(page);
  await page.locator("#chat-input").fill("Quanto tempo di cottura?");
  await page.getByRole("button", { name: "Invia domanda" }).click();
  await expect(page.locator(".chat-message-assistant")).toContainText("Risposta di prova.");

  // Avvia il salvataggio manuale (fetch in volo)
  await Promise.all([
    page.waitForRequest((r) => r.url().includes("/api/complete") && r.method() === "POST"),
    page.getByRole("button", { name: "Salva sessione per l'analisi" }).click(),
  ]);

  // Chiude la chat
  await page.locator(".dialog-close").click();
  await expect(page.locator(".chat-dialog")).toHaveCount(0);

  // Riapre la chat: openChat() incrementa la generazione e resetta lo stato a "idle"
  await page.locator(".recipe-chat-trigger").click();
  await expect(page.locator(".chat-dialog")).toBeVisible();

  // Verifica che il pulsante sia nello stato "idle" dopo il reopen
  const saveButton = page.locator(".chat-save-trigger");
  await expect(saveButton).toHaveAttribute("data-save-status", "idle");

  // Sblocca il fetch stale: senza il generation guard il callback impostarebbe "done"
  releaseComplete();

  // Attende che eventuali aggiornamenti React si propaghino
  await page.waitForTimeout(200);

  // Lo stato deve rimanere "idle" — non "done" — perché il generation guard ha bloccato
  // l'applicazione dello stato stale da parte della callback in volo
  await expect(saveButton).toHaveAttribute("data-save-status", "idle");
});
