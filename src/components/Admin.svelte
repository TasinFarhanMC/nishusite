<script lang="ts">
  import { S3Client } from "@aws-sdk/client-s3";
  import { getS3Client, uploadBinary, uploadNumber } from "../assets/s3.ts";
  import { fetchPanels, setInStore, type PanelRecord } from "../assets/panels";
  import { fetchNumber } from "../assets/file";
  import { onMount } from "svelte";
  import { PasswordError } from "../assets/crypto.ts";
  import { Panel, PanelMap } from "../assets/gen/panel.ts";

  let error = $state("");
  let s3: S3Client = $state(new S3Client());

  let debugNumber: number | bigint = $state(0);
  let debugPath: string = $state("");

  let panels: PanelRecord = $state({});
  let nextId = 1;

  function addPanel() {
    panels[nextId] = {
      watt: 0,
      battery: 0,
      panelCable: 0,
      wiringCable: 0,
      light: 0,
      charger: 0,
      structure: "product",
      hour: 0,
      extraHour: 0,
      dcFanSmall: 0,
      dcFanTable: 0,
      dcFanStand: 0,
      price: 0,
    };
    nextId++;
  }

  function deletePanel(id: number) {
    delete panels[id];
  }

  async function handleUploadPanels() {
    try {
      const data = PanelMap.encode({ panels }).finish();
      await uploadBinary(s3, "panels.pb", data);
      await uploadNumber(s3, "count", nextId);

      const now = Date.now();

      await uploadNumber(s3, "time", now);

      await setInStore("panels", "data", data);
      await setInStore("meta", "panelsTime", now);
      alert("Panels uploaded successfully!");
    } catch (err) {
      error = `Upload failed: ${(err as Error).message}`;
    }
  }

  async function handleDebugUploadNumber() {
    if (!debugPath) {
      error = "Enter a path for debug upload";
      return;
    }

    try {
      await uploadNumber(s3, debugPath, debugNumber);
      alert(`Uploaded number ${debugNumber} to ${debugPath}`);
    } catch (err) {
      error = `Debug upload failed: ${(err as Error).message}`;
    }
  }

  async function loadPanels() {
    try {
      panels = (await fetchPanels()).panels;

      try {
        const counter = await fetchNumber("count");
        nextId = Number(counter);
      } catch {
        const keys = Object.keys(panels).map(Number);
        nextId = keys.length ? Math.max(...keys) + 1 : 1;
      }
    } catch (err) {
      error = err as string;
    }
  }

  onMount(async () => {
    try {
      s3 = await getS3Client();
      return loadPanels();
    } catch (err) {
      if (err instanceof PasswordError) {
        error = err.message;
        return;
      }
    }

    const url = new URL("/login", window.location.origin);
    url.searchParams.set("redirect", window.location.pathname);
    window.location.href = url.toString();
  });
</script>

{#if error}
  <p class="error">{error}</p>
{/if}

<div style="margin-bottom: 1rem;">
  <a
    href="/"
    style="text-decoration: none; color: white; background: #007acc; padding: 0.5rem 1rem; border-radius: 4px;"
    >Home</a
  >
</div>

<div>
  <h1>Admin AWS Panels Manager</h1>

  <div class="creds-box">
    <h3>Panels</h3>
    <button onclick={addPanel} style="margin-bottom: 0.5rem;">Add Panel</button>

    {#if Object.keys(panels).length > 0}
      <table border="1" cellpadding="4" cellspacing="0">
        <thead>
          <tr>
            <th>ID</th>
            {#each Object.keys(panels[Number(Object.keys(panels)[0])]) as field}<th
                >{field}</th
              >{/each}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(panels) as [id, panel]}
            <tr>
              <td>{id}</td>
              {#each Object.keys(panel) as key}
                <td>
                  <input
                    type={typeof panel[key as keyof Panel] === "number"
                      ? "number"
                      : "text"}
                    bind:value={panel[key as keyof Panel]}
                  />
                </td>
              {/each}
              <td
                ><button onclick={() => deletePanel(Number(id))}>Delete</button
                ></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
      <button onclick={handleUploadPanels} style="margin-top: 1rem;"
        >Upload Panels</button
      >
    {:else}
      <p>No panel data found.</p>
    {/if}
  </div>
  <h3>Debug Upload Number</h3>
  <input type="number" bind:value={debugNumber} placeholder="Enter number" />
  <input type="text" bind:value={debugPath} placeholder="S3 path/key" />
  <button onclick={handleDebugUploadNumber}>Upload Number</button>
</div>

<style>
  .creds-box {
    margin-top: 1rem;
    background: #f0f0f0;
    padding: 1rem;
  }
  table {
    margin-top: 0.5rem;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 0.3rem 0.5rem;
  }
  .error {
    color: red;
  }
  input {
    margin-right: 0.5rem;
    padding: 0.3rem;
  }
  button {
    padding: 0.3rem 0.6rem;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
  }
  button:hover {
    background: #005fa3;
  }
</style>
