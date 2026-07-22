<template>
  <div class="page-content">
    <header>
      <h1>Shooting Stars Meme Generator</h1>
    </header>
    <main>
      <form class="form" @submit.prevent="uploadImage">
        <div class="select-group">
          <label for="template" style="align-self: start;">Choose a video template</label>
          <div class="select">
            <select v-model="selectedTemplate" id="template">
              <option value="meme_template_2">Small Version (1 min)</option>
              <option value="meme_template">Big Version (5 min)</option>
            </select>
          </div>
        </div>

        <div class="select-group">
          <label for="intro" style="align-self: start;">Intro video</label>
          <div class="select">
            <select v-model="introMode" id="intro">
              <option value="default">Default intro</option>
              <option value="custom">Upload your own intro</option>
              <option value="none">No intro</option>
            </select>
          </div>
          <input v-if="introMode === 'custom'" class="intro-file" type="file"
                 accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/avi"
                 @change="handleIntroUpload"/>
          <small v-if="introMode === 'custom'" class="field-hint">Max 60 seconds (mp4, mov, webm, m4v or avi).</small>
        </div>

        <div class="uploader">
          <label for="file-upload" id="file-drag">
            <img id="file-image" src="#" alt="Preview" class="hidden">
            <div id="start">
              <i class="fa fa-download" aria-hidden="true"></i>
              <div>Select a file or drag here</div>
              <div id="notimage" class="hidden">Please select an image</div>
              <span id="file-upload-btn" class="btn btn-primary">Select a file</span>
            </div>
            <div id="response" class="hidden">
              <div id="messages"></div>
            </div>
          </label>
          <input id="file-upload" type="file" name="fileUpload" accept="image/*" @change="handleFileUpload"/>
        </div>
        <label class="checkbox-group">
          <input type="checkbox" v-model="removeBackground"/>
          Cut out the subject automatically (make the background transparent)
        </label>
        <button class="submit-button" type="submit" :disabled="busy">
          {{ busy ? 'Generating…' : 'Generate video' }}
        </button>
      </form>
      <div v-if="message" class="message">{{ message }}</div>
      <div v-if="phase === 'uploading'" class="progress-container">
        <p>Uploading: {{ uploadProgress }}%</p>
        <progress :value="uploadProgress" max="100"></progress>
      </div>
      <div v-else-if="phase === 'queued'" class="progress-container">
        <p>{{ stageText }}</p>
        <progress></progress>
      </div>
      <div v-else-if="phase === 'processing'" class="progress-container">
        <p>{{ stageText }}</p>
        <progress :value="renderProgress" max="100"></progress>
      </div>
      <div v-if="cutoutUrl" class="cutout-preview">
        <div>Cutout used in your video:</div>
        <img :src="cutoutUrl" alt="Subject cutout"/>
      </div>
      <div class="preview" v-if="!videoUrl && !busy">
        <div>Preview</div>
        <video v-if="selectedTemplate==='meme_template_2'" class="video-preview"
               controls>
          <source :src="defaultVideos.memeTemplate2" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <video v-if="selectedTemplate==='meme_template'" class="video-preview"
               controls>
          <source :src="defaultVideos.memeTemplate" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
      <video v-if="videoUrl" class="video-preview" controls>
        <source :src="videoUrl" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div>
        <a v-if="videoUrl" :href="videoUrl" target="_blank" download="output.mp4">
          <button class="download-button">Download Video</button>
        </a>
      </div>
    </main>
    <footer>
      Created by <a href="https://milovanderpas.nl/" target="_blank">Milo</a>
    </footer>
  </div>
</template>

<script>
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL_MS = 1500;

export default {
  data() {
    return {
      defaultVideos: {
        memeTemplate2: new URL(`../assets/videos/meme_template_2.mp4`, import.meta.url).href,
        memeTemplate: new URL(`../assets/videos/meme_template.mp4`, import.meta.url).href,
      },
      selectedFile: null,
      selectedTemplate: 'meme_template_2', // Default to the small version
      introMode: 'default', // default | custom | none
      introFile: null,
      removeBackground: false,
      phase: 'idle', // idle | uploading | queued | processing | finished | failed
      message: '',
      videoUrl: '',
      cutoutUrl: '',
      uploadProgress: 0,
      renderProgress: 0,
      queuePosition: 0,
      stage: '',
      renderId: null,
      pollTimer: null
    };
  },
  computed: {
    busy() {
      return ['uploading', 'queued', 'processing'].includes(this.phase);
    },
    stageText() {
      if (this.phase === 'queued') {
        return this.queuePosition > 0
            ? `Waiting in queue — ${this.queuePosition} ahead of you…`
            : 'Waiting for the renderer…';
      }
      if (this.stage === 'removing_background') {
        return 'Cutting out the subject…';
      }
      return `Rendering video: ${this.renderProgress}%`;
    }
  },
  mounted() {
    this.ekUpload();
  },
  beforeUnmount() {
    clearTimeout(this.pollTimer);
  },
  methods: {
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },
    handleIntroUpload(event) {
      this.introFile = event.target.files[0];
    },
    async uploadImage() {
      if (this.busy) {
        return;
      }
      if (!this.selectedFile) {
        this.message = 'Please select a file first.';
        return;
      }
      if (this.introMode === 'custom' && !this.introFile) {
        this.message = 'Please select an intro video first.';
        return;
      }

      clearTimeout(this.pollTimer);
      this.message = '';
      this.videoUrl = '';
      this.cutoutUrl = '';
      this.uploadProgress = 0;
      this.renderProgress = 0;
      this.queuePosition = 0;
      this.phase = 'uploading';

      const formData = new FormData();
      formData.append('image', this.selectedFile);
      formData.append('template', this.selectedTemplate); // Send the selected template
      formData.append('remove_background', this.removeBackground ? '1' : '0');
      formData.append('intro_mode', this.introMode);
      if (this.introMode === 'custom') {
        formData.append('intro', this.introFile);
      }

      try {
        const response = await axios.post(`${API_URL}/api/shooting-stars/renders`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (event) => {
            if (event.total) {
              this.uploadProgress = Math.round((event.loaded / event.total) * 100);
            }
          },
        });
        this.renderId = response.data.render_id;
        this.phase = 'queued';
        this.pollStatus();
      } catch (error) {
        this.phase = 'failed';
        this.message = error.response?.data?.error || 'An error occurred while uploading the file.';
      }
    },
    async pollStatus() {
      const renderId = this.renderId;
      try {
        const {data} = await axios.get(`${API_URL}/api/shooting-stars/renders/${renderId}`);
        if (renderId !== this.renderId) {
          return; // a newer render was started in the meantime
        }
        this.stage = data.stage;
        this.renderProgress = data.progress;
        this.queuePosition = data.queue_position || 0;
        if (data.cutout_image) {
          // The subject cutout is exposed as soon as it is ready, while the
          // video itself is still rendering
          this.cutoutUrl = `${API_URL}${data.cutout_image}`;
        }
        if (data.status === 'finished') {
          // output_video is an absolute path (e.g. /api/shooting-stars/outputs/<id>.mp4)
          this.videoUrl = `${API_URL}${data.output_video}`;
          this.phase = 'finished';
          this.message = 'Video generated successfully!';
          return;
        }
        if (data.status === 'failed') {
          this.phase = 'failed';
          this.message = data.error || 'The render failed. Please try again.';
          return;
        }
        this.phase = data.status === 'queued' ? 'queued' : 'processing';
      } catch (error) {
        if (renderId !== this.renderId) {
          return;
        }
        if (error.response?.status === 404) {
          this.phase = 'failed';
          this.message = 'This render is no longer available.';
          return;
        }
        // Transient network/server hiccup: keep polling
      }
      this.pollTimer = setTimeout(() => this.pollStatus(), POLL_INTERVAL_MS);
    },
    getBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    },
    ekUpload() {
      function init() {
        const fileSelect = document.getElementById('file-upload'),
            fileDrag = document.getElementById('file-drag');
        fileSelect.addEventListener('change', fileSelectHandler, false);

        // Is XHR2 available?
        const xhr = new XMLHttpRequest();
        if (xhr.upload) {
          // File Drop
          fileDrag.addEventListener('dragover', fileDragHover, false);
          fileDrag.addEventListener('dragleave', fileDragHover, false);
          fileDrag.addEventListener('drop', fileSelectHandler, false);
        }
      }

      function fileDragHover(e) {
        const fileDrag = document.getElementById('file-drag');

        e.stopPropagation();
        e.preventDefault();

        fileDrag.className = (e.type === 'dragover' ? 'hover' : 'modal-body file-upload');
      }

      function fileSelectHandler(e) {
        // Fetch FileList object
        const files = e.target.files || e.dataTransfer.files;

        // Cancel event and hover styling
        fileDragHover(e);

        // Process all File objects
        let i = 0;
        let f = files[i];
        while(f){
          parseFile(f);
          i++;
          f = files[i];
        }
      }

      // Output
      function output(msg) {
        // Response
        const m = document.getElementById('messages');
        m.innerHTML = msg;
      }

      function parseFile(file) {
        output(
            '<strong>' + encodeURI(file.name) + '</strong>'
        );

        const imageName = file.name;

        const isGood = (/\.(?=gif|jpg|png|jpeg)/gi).test(imageName);
        if (isGood) {
          document.getElementById('start').classList.add("hidden");
          document.getElementById('response').classList.remove("hidden");
          document.getElementById('notimage').classList.add("hidden");
          // Thumbnail Preview
          document.getElementById('file-image').classList.remove("hidden");
          document.getElementById('file-image').src = URL.createObjectURL(file);
        } else {
          document.getElementById('file-image').classList.add("hidden");
          document.getElementById('notimage').classList.remove("hidden");
          document.getElementById('start').classList.remove("hidden");
          document.getElementById('response').classList.add("hidden");
          document.getElementById("file-upload-form").reset();
        }
      }

      // Check for the constious File API support.
      if (window.File && window.FileList && window.FileReader) {
        init();
      } else {
        document.getElementById('file-drag').style.display = 'none';
      }
    }
  }
}
</script>

<style lang="scss">
@import url(https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css);

$primary-color: $blue;
$dark-color: $dark-blue;

#app {
  display: flex;
  flex-flow: column;
  text-align: center;
  padding: 20px;
  font-family: Arial, sans-serif;
  min-height: 100vh;
}

.page-content{
  display: flex;
  flex-flow: column;
  flex:1;
}

header {
  background-color: $primary-color;
  color: white;
  padding: 20px 0;
  border-radius: 0 0 10px 10px;
}

h1 {
  margin: 0;
  font-size: 2rem;
  color: $white;
}

main {
  flex: 1;
}

form {
  display: flex;
  flex-flow: column;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
  border-radius: 0 0 10px 10px;
  box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;
  padding: 20px;

  .select-group{
    display: flex;
    flex-flow: column;
    text-align: left;
    gap: 3px;

    label{
      font-weight: bold;
    }

    select {
      /* Reset Select */
      appearance: none;
      outline: 10px red;
      box-shadow: none;
      border: 0;
      /* Personalize */
      flex: 1;
      padding: 0 1em;
      color: $dark-color;
      background-color: white;
      background-image: none;
      cursor: pointer;
    }
    /* Remove IE arrow */
    select::-ms-expand {
      display: none;
    }
    /* Custom Select wrapper */
    .select {
      position: relative;
      display: flex;
      width: 100%;
      max-width: 20em;
      height: 3em;
      border: 3px solid #eee;
      border-radius: .25em;
      overflow: hidden;
    }
    /* Arrow */
    .select::after {
      content: '\25BC';
      position: absolute;
      top: 0;
      right: 0;
      padding: 1em;
      background-color: white;
      transition: .25s all ease;
      pointer-events: none;
      border: 3px solid #eee;
    }
    /* Transition */
    .select:hover {
      border-color: $primary-color;
    }
    .select:hover::after {
      color: $dark-color;
    }
  }

  .uploader {
    display: block;
    clear: both;
    margin: 0 auto;
    width: 100%;

    label {
      float: left;
      clear: both;
      width: 100%;
      padding: 2rem 0;
      text-align: center;
      background: #fff;
      border-radius: 7px;
      border: 3px solid #eee;
      transition: all .2s ease;
      user-select: none;

      &:hover {
        border-color: $primary-color;
      }

      &.hover {
        border: 3px solid $primary-color;
        box-shadow: inset 0 0 0 6px #eee;

        #start {
          i.fa {
            transform: scale(0.8);
            opacity: 0.3;
          }
        }
      }
    }

    #start {
      float: left;
      clear: both;
      width: 100%;

      &.hidden {
        display: none;
      }

      i.fa {
        font-size: 50px;
        margin-bottom: 1rem;
        transition: all .2s ease-in-out;
      }
    }

    #response {
      float: left;
      clear: both;
      width: 100%;

      &.hidden {
        display: none;
      }

      #messages {
        margin-bottom: .5rem;
      }
    }

    #file-image {
      display: inline;
      margin: 0 auto .5rem auto;
      width: auto;
      height: auto;
      max-width: 180px;

      &.hidden {
        display: none;
      }
    }

    #notimage {
      display: block;
      float: left;
      clear: both;
      width: 100%;

      &.hidden {
        display: none;
      }
    }

    input[type="file"] {
      display: none;
    }

    div {
      color: $dark-color;
    }

    .btn {
      display: inline-block;
      margin: .5rem .5rem 1rem .5rem;
      clear: both;
      font-family: inherit;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      text-transform: initial;
      border: none;
      border-radius: .2rem;
      outline: none;
      padding: 0 1rem;
      height: 36px;
      line-height: 36px;
      color: #fff;
      transition: all 0.2s ease-in-out;
      box-sizing: border-box;
      background: $primary-color;
      border-color: $primary-color;
      cursor: pointer;
    }
  }
}

video {
  max-width: 100%;
  border-radius: 10px;
  margin: 20px 0;
}

.preview{
  display: flex;
  flex-flow: column;
  video{
    margin: 10px 0 0 0;
  }
}

button {
  background-color: $primary-color;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: $dark-color;
}

.message {
  margin: 20px 0 0 0;
  font-size: 1.2rem;
}

.progress-container {
  margin: 20px 0;
}

progress {
  width: 100%;
  height: 20px;
  border-radius: 10px;
}

progress::-moz-progress-bar {
  background: $primary-color;
}

progress::-webkit-progress-value {
  background: $primary-color;
}

progress {
  color: $primary-color;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  font-weight: bold;
  color: $dark-color;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: $primary-color;
    cursor: pointer;
    margin: 0;
  }
}

.intro-file {
  padding: 10px;
  background: #fff;
  border: 3px solid #eee;
  border-radius: .25em;
  cursor: pointer;

  &:hover {
    border-color: $primary-color;
  }
}

.field-hint {
  color: #777;
  text-align: left;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cutout-preview {
  display: flex;
  flex-flow: column;
  align-items: center;
  gap: 5px;
  margin: 10px 0;
  color: $dark-color;

  img {
    max-width: 180px;
    max-height: 180px;
    border-radius: 10px;
    border: 3px solid #eee;
    padding: 5px;
    /* checkerboard, so the transparency of the cutout is visible */
    background: repeating-conic-gradient(#e8e8e8 0% 25%, #ffffff 0% 50%) 0 0 / 20px 20px;
  }
}

footer {
  margin-top: auto; // Pushes the footer to the bottom
  color: $primary-color;
  text-align: center;
  padding-top: 20px;
  a {
    color: $dark-color;
  }
}

</style>
