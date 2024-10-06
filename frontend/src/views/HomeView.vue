<template>
  <div class="page-content">
    <header>
      <h1>Shooting Stars Meme Creator</h1>
    </header>
    <main>
      <form class="form" @submit.prevent="uploadImage">
        <div class="select-group">
          <label for="template" style="align-self: start;">Video template</label>
          <div class="select">
            <select v-model="selectedTemplate" id="template">
              <option value="meme_template_2">Small Version (1 min)</option>
              <option value="meme_template">Big Version (5 min)</option>
            </select>
          </div>
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
        <button class="submit-button" type="submit">Generate video</button>
      </form>
      <div v-if="message" class="message">{{ message }}</div>
      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress-container">
        <p>Uploading: {{ uploadProgress }}%</p>
        <progress :value="uploadProgress" max="100"></progress>
      </div>
      <div class="preview" v-if="!videoUrl && uploadProgress === 0">
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

export default {
  data() {
    return {
      defaultVideos: {
        memeTemplate2: new URL(`../assets/videos/meme_template_2.mp4`, import.meta.url).href,
        memeTemplate: new URL(`../assets/videos/meme_template.mp4`, import.meta.url).href,
      },
      selectedFile: null,
      selectedTemplate: 'meme_template_2', // Default to the small version
      message: '',
      videoUrl: '',
      uploadProgress: 0
    };
  },
  mounted() {
    this.ekUpload();
  },
  methods: {
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },
    updateProgress(duration) {
      if (this.uploadProgress !== 0) {
        setTimeout(() => {
          if (this.uploadProgress !== 0 && this.uploadProgress < 99) {
            this.uploadProgress++;
          }
          this.updateProgress(duration);
        }, duration / 100);
      }
    },
    async uploadImage() {
      if (!this.selectedFile) {
        this.message = 'Please select a file first.';
        return;
      }

      const formData = new FormData();
      formData.append('image', this.selectedFile);
      formData.append('template', this.selectedTemplate); // Send the selected template

      try {
        const duration = this.selectedTemplate === 'meme_template_2' ? 60000 : 300000;
        this.uploadProgress = 1;
        this.message = '';
        this.videoUrl = '';
        this.updateProgress(duration);
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
        });
        this.message = response.data.message;
        this.videoUrl = `${import.meta.env.VITE_API_URL}/${response.data.output_video}`;
        this.uploadProgress = 0; // Reset progress bar
      } catch (error) {
        this.message = 'An error occurred while uploading the file.';
        this.uploadProgress = 0; // Reset progress bar
      }
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
