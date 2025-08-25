<script lang="ts">
  import { getUrl } from "../assets/file";
  import { createS3creds } from "../assets/s3";

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

    try {
      const creds = await createS3creds(password);
      sessionStorage.setItem("s3Creds", JSON.stringify(creds));

      if (remember) {
        localStorage.setItem("password", password);
      }

      window.location.href = redirect;
    } catch (e) {
      error = e as string;
    }
  }
</script>

<div>
  <input
    class="password"
    type="password"
    bind:value={password}
    placeholder="Enter admin password"
  />
  <button onclick={handleLogin}>Login</button>

  <label class="remember">
    <input type="checkbox" bind:checked={remember} />
    Remember Me
  </label>

  {#if error}
    <p class="error" style="color: red;">{error}</p>
  {/if}
</div>
