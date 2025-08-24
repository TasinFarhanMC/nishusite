<script lang="ts">
  import { S3Client } from "@aws-sdk/client-s3";
  import {
    createS3ClientFromPass,
    getS3Client,
    isLoggedIn,
    uploadNumber,
    uploadPanels as uploadPanelsToS3,
  } from "../assets/s3.ts";
  import { fetchPanels, type Panel } from "../assets/panels";
  import { fetchNumber } from "../assets/file";
  import { onMount } from "svelte";

  let error = $state("");
  let s3: S3Client = $state(new S3Client());

  let debugNumber: number | bigint = $state(0);
  let debugPath: string = $state("");

  let panelsRecord: Record<number, Panel> = $state({});
  let nextId = 1;

  function addPanel() {
    panelsRecord[nextId] = {
      watt: 0,
      battery: 0,
      panel_cable: 0,
      wiring_cable: 0,
      light: 0,
      charger: 0,
      structure: "product",
      hour: 0,
      extra_hour: 0,
      dc_fan_small: 0,
      dc_fan_table: 0,
      dc_fan_stand: 0,
      price: 0,
    };
    nextId++;
  }

  function deletePanel(id: number) {
    delete panelsRecord[id];
  }

  async function handleUploadPanels() {
    try {
      await uploadPanelsToS3(s3, panelsRecord);
      await uploadNumber(s3, BigInt(nextId), "count");
      await uploadNumber(s3, BigInt(Date.now()), "time");
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
      await uploadNumber(s3, BigInt(debugNumber), debugPath);
      alert(`Uploaded number ${debugNumber} to ${debugPath}`);
    } catch (err) {
      error = `Debug upload failed: ${(err as Error).message}`;
    }
  }

  async function loadPanels() {
    try {
      const fetchedPanels = await fetchPanels();
      panelsRecord = { ...fetchedPanels };

      try {
        const counter = await fetchNumber("count");
        nextId = Number(counter);
      } catch {
        const keys = Object.keys(fetchedPanels).map(Number);
        nextId = keys.length ? Math.max(...keys) + 1 : 1;
      }
    } catch (err) {
      error = err as string;
    }
  }

  onMount(async () => {
    if (isLoggedIn()) {
      s3 = getS3Client();
      return loadPanels();
    }

    const password = localStorage.getItem("password");
    if (password) {
      try {
        s3 = await createS3ClientFromPass(password);
        return loadPanels();
      } catch (e) {
        if (e != "Wrong Password") {
          error = e as string;
          return;
        }
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

    {#if Object.keys(panelsRecord).length > 0}
      <table border="1" cellpadding="4" cellspacing="0">
        <thead>
          <tr>
            <th>ID</th>
            {#each Object.keys(panelsRecord[Number(Object.keys(panelsRecord)[0])]) as field}<th
                >{field}</th
              >{/each}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(panelsRecord) as [id, panel]}
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
