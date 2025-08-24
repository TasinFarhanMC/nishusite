<script lang="ts">
  import { decrypt } from "../assets/crypto";
  import { getUrl } from "../assets/file";
  import type { EncriptedS3Creds } from "../assets/s3";

  // Get redirect directly from URL
  let redirect = "/";
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    redirect = params.get("redirect") || "/";
  }

  let password = $state("");
  let remember = $state(false);
  let error = $state("");

  async function handleLogin() {
    const res = await fetch(getUrl("s3.json"), { cache: "reload" });
    if (!res.ok) {
      error = `Failed to fetch: ${res.status}`;
      return;
    }

    const encriptedCreds: EncriptedS3Creds = await res.json();

    try {
      const secretAccessKey = await decrypt(
        encriptedCreds.encryptedSecretAccessKey,
        password,
      );

      sessionStorage.setItem(
        "s3Creds",
        JSON.stringify({
          accessKeyId: encriptedCreds.accessKeyId,
          secretAccessKey: secretAccessKey,
        }),
      );

      if (remember) {
        localStorage.setItem("password", password);
      }

      window.location.href = redirect;
    } catch (e) {
      error = (e as Error).message || String(e);
    }
  }
</script>

<h1>Admin Login Panel</h1>

<div>
  <input
    type="password"
    bind:value={password}
    placeholder="Enter admin password"
  />
  <button onclick={handleLogin}>Login</button>
</div>

<label>
  <input type="checkbox" bind:checked={remember} />
  Remember Me
</label>

{#if error}
  <p class="error" style="color: red;">{error}</p>
{/if}
