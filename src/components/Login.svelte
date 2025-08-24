<script lang="ts">
  import { getDecryptedCredentials ,} from "../assets/s3";
  let password = $state("");

  async function handleDecrypt() {
    let accessKeyId = "";
    let secretAccessKey = "";
    let error = "";

    try {
      const creds = await getDecryptedCredentials(password);
      if (!creds) {
        error = "Wrong password or corrupted data";
        return;
      }

      accessKeyId = creds.accessKeyId;
      secretAccessKey = creds.secretAccessKey;
      s3 = getS3Client(creds);

      const fetchedPanels = await fetchPanels();
      console.log(fetchedPanels);
      panels = Object.values(fetchedPanels);
    } catch (err) {
      error = (err as Error).message;
    }
  }
</script>

<h1>Admin AWS Credentials Viewer</h1>

<div>
  <input
    type="password"
    bind:value={password}
    placeholder="Enter admin password"
  />
  <button onclick={handleDecrypt}>Login</button>
</div>
