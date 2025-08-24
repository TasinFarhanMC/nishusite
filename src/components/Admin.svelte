<script lang="ts">
  import { S3Client, type _Object, PutObjectCommand } from "@aws-sdk/client-s3";
  import { bucketName, getS3Client } from "../assets/s3.ts";
  import { fetchPanels, type Panel } from "../assets/panels.ts";

  let password = $state("");
  let files: string[] = $state([]);
  let error: string | null = $state(null);
  let s3: S3Client | null = $state(null);

  let panels: Panel[] = $state([]);
  let panel_ids: string[] = $state([]);
  $effect(() => {
    Promise.all(panels.map((p) => hashPanel(p))).then((ids) => {
      panel_ids = ids;
    });
  });

  async function hashPanel(panel: Panel): Promise<string> {
    const { price, ...rest } = panel;
    const str = JSON.stringify(rest);
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex.slice(0, 8); // first 8 chars
  }

  function addPanel() {
    panels = [
      ...panels,
      {
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
      } as Panel,
    ];
  }

  function deletePanel(index: number) {
    panels = panels.filter((_, i) => i !== index);
  }

  async function handleDecrypt() {
    error = null;
    files = [];
    panels = [];
    panel_ids = [];

    try {
      s3 = await getS3Client(password);

      const fetchedPanels = await fetchPanels();
      console.log(fetchedPanels);
      panels = Object.values(fetchedPanels); // convert record to array
    } catch (err) {
      error = (err as Error).message;
    }
  }

  async function uploadPanels() {
    if (!s3) {
      error = "S3 client not initialized";
      return;
    }

    try {
      // Recompute hashes before upload
      const panelIds = await Promise.all(panels.map((p) => hashPanel(p)));
      const record: Record<string, Panel> = {};
      for (let i = 0; i < panels.length; i++) {
        record[panelIds[i]] = panels[i];
      }

      const json = JSON.stringify(record);
      const key = "panels.json";

      // Upload new panels.json
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: json,
          ContentType: "application/json",
          CacheControl: "max-age=60", // cached for 30 seconds
        }),
      );

      await uploadTime();
      alert("Panels uploaded successfully!");

      localStorage.setItem("panels", json);
    } catch (err) {
      error = `Upload failed: ${(err as Error).message}`;
    }
  }

  async function uploadTime() {
    if (!s3) {
      error = "S3 client not initialized";
      return;
    }

    try {
      const unixTime = BigInt(Date.now());

      // allocate 8 bytes
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setBigUint64(0, unixTime, false); // false = big endian

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: "time",
          Body: new Uint8Array(buffer), // raw 8 bytes
          ContentType: "application/octet-stream",
          CacheControl: "no-cache",
        }),
      );
    } catch (err) {
      error = `Upload time failed: ${(err as Error).message}`;
    }
  }
</script>

<div style="margin-bottom: 1rem;">
  <a
    href="/"
    style="text-decoration: none; color: white; background: #007acc; padding: 0.5rem 1rem; border-radius: 4px;"
  >
    Home
  </a>
</div>

<div>
  <h1>Admin AWS Credentials Viewer</h1>

  <div>
    <input
      type="password"
      bind:value={password}
      placeholder="Enter admin password"
    />
    <button onclick={handleDecrypt}>Login</button>
  </div>

  {#if s3 != null}
    <div class="creds-box">
      <h3>Decrypted AWS Credentials:</h3>

      <h3>Panels</h3>
      <button onclick={addPanel} style="margin-bottom: 0.5rem;"
        >Add Panel</button
      >
      {#if panels.length > 0}
        <table border="1" cellpadding="4" cellspacing="0">
          <thead>
            <tr>
              <th>ID</th>
              {#each Object.keys(panels[0]) as field}
                <th>{field}</th>
              {/each}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each panels as panel, i}
              <tr>
                <td>{panel_ids[i]}</td>
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
                <td>
                  <button onclick={() => deletePanel(i)}>Delete</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        <button onclick={uploadPanels} style="margin-top: 1rem;">
          Upload
        </button>
      {:else}
        <p>No panel data found.</p>
      {/if}
    </div>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}
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
</style>
