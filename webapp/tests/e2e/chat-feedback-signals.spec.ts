import { expect, test } from "@playwright/test";

const recipePath = "/recipes/polpo-sous-vide";
const shareStorageKey = "danio-cooks-chat-share-v1";

async function openChatAndAcceptConsent(page: import("@playwright/test").Page) {
  await page.goto(recipePath);
  await page.locator(".recipe-chat-trigger").click();
  await page.locator(".chat-consent-accept").click();
}

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
    (s) => window.localStorage.getItem(`danio-cooks-chat-sent-upto:${s}`),
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
    (s) => window.localStorage.getItem(`danio-cooks-chat-sent-upto:${s}`),
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
  const historyKey = `danio-cooks-chat:${slug}`;
  const sentUptoStorageKey = `danio-cooks-chat-sent-upto:${slug}`;

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
  await expect(article).toContainText("90 giorni");
  await expect(article).toContainText("intestazione della chat");
  await expect(article).toContainText("10 giorni di inattivita");
});
