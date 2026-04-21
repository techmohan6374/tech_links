var CONFIG = {
    cloudName: "dk1i8ceah",
    uploadPreset: "tech_links",
    scriptUrl: "https://script.google.com/macros/s/AKfycbxU6Bqbw6v6k02vJ-pigmER884CmreQz15eyXZejvlza_d4vo2La48XsXPHv68lD4jv/exec"
};

var vm = new Vue({
    el: "#app",
    data: {
        websites: [],
        query: '',
        loading: true,
        isDark: false,
        listView: false,

        // Add form
        showForm: false,
        formSubmitting: false,
        form: {
            websiteName: '',
            websiteUrl: '',
            websiteDesc: '',
            imageFile: null,
            previewUrl: ''
        },
        errors: {
            websiteName: false,
            websiteUrl: false,
            websiteDesc: false,
            imageFile: false
        },
        formStatus: { msg: '', isError: false }
    },
    computed: {
        filtered() {
            const q = this.query.trim().toLowerCase();
            if (!q) return this.websites;
            return this.websites.filter(item =>
                (item['Website Name'] || '').toLowerCase().includes(q) ||
                (item['Website Desc'] || '').toLowerCase().includes(q) ||
                (item['Website URL'] || '').toLowerCase().includes(q)
            );
        }
    },
    mounted() {
        const saved = localStorage.getItem('wc-theme');
        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            this.isDark = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        this.getData();
    },
    methods: {
        toggleTheme() {
            this.isDark = !this.isDark;
            const theme = this.isDark ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('wc-theme', theme);
        },
        onImgLoad(item) {
            this.$set(item, '_loaded', true);
        },

        onImgError(item) {
            this.$set(item, '_loaded', true);
        },

        async copyUrl(item) {
            const url = item['Website URL'];
            if (!url) return;
            try {
                await navigator.clipboard.writeText(url);
            } catch (e) {
                const ta = document.createElement('textarea');
                ta.value = url;
                ta.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            this.$set(item, '_copied', true);
            setTimeout(() => this.$set(item, '_copied', false), 2000);
        },

        reloadData() {
            this.getData();
        },

        // ── Add Form Methods ───────────────────────────
        closeForm() {
            this.showForm = false;
            this.resetForm();
        },

        onFileChange(e) {
            const file = e.target.files[0];
            if (!file) return;
            this.form.imageFile = file;
            this.form.previewUrl = URL.createObjectURL(file);
            this.errors.imageFile = false;
        },

        validateForm() {
            let valid = true;
            this.errors.websiteName = !this.form.websiteName.trim();
            this.errors.websiteDesc = !this.form.websiteDesc.trim();
            this.errors.imageFile = !this.form.imageFile;

            const urlPattern = /^https?:\/\/.+/;
            this.errors.websiteUrl = !urlPattern.test(this.form.websiteUrl.trim());

            if (this.errors.websiteName || this.errors.websiteDesc || this.errors.websiteUrl || this.errors.imageFile) {
                valid = false;
            }
            return valid;
        },

        setFormStatus(msg, isError = false) {
            this.formStatus = { msg, isError };
        },

        async uploadImageToCloudinary(file) {
            const uploadUrl = `https://api.cloudinary.com/v1_1/${CONFIG.cloudName}/image/upload`;
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CONFIG.uploadPreset);
            const response = await fetch(uploadUrl, { method: "POST", body: formData });
            if (!response.ok) throw new Error("Image upload failed");
            const result = await response.json();
            return result.secure_url;
        },

        async saveWebsiteData(data) {
            const formData = new FormData();
            formData.append("websiteUrl", data.websiteUrl);
            formData.append("websiteDesc", data.websiteDesc);
            formData.append("websiteName", data.websiteName);
            formData.append("thumbnailUrl", data.thumbnailUrl);
            const response = await fetch(CONFIG.scriptUrl, { method: "POST", body: formData });
            if (!response.ok) throw new Error("Script API failed");
            return await response.text();
        },

        resetForm() {
            this.form = { websiteName: '', websiteUrl: '', websiteDesc: '', imageFile: null, previewUrl: '' };
            this.errors = { websiteName: false, websiteUrl: false, websiteDesc: false, imageFile: false };
            this.formStatus = { msg: '', isError: false };
            this.formSubmitting = false;
        },

        async handleSubmit() {
            if (!this.validateForm()) return;
            this.formSubmitting = true;
            try {
                this.setFormStatus("Uploading image...");
                const imageUrl = await this.uploadImageToCloudinary(this.form.imageFile);
                this.setFormStatus("Saving data...");
                await this.saveWebsiteData({
                    websiteUrl: this.form.websiteUrl.trim(),
                    websiteDesc: this.form.websiteDesc.trim(),
                    websiteName: this.form.websiteName.trim(),
                    thumbnailUrl: imageUrl
                });
                this.setFormStatus("Saved successfully ✅");
                setTimeout(() => {
                    this.closeForm();
                    this.getData();
                }, 1200);
            } catch (error) {
                console.error(error);
                this.setFormStatus("Operation failed ❌", true);
                this.formSubmitting = false;
            }
        },

        getData() {
            this.loading = true;
            axios.get("https://script.google.com/macros/s/AKfycbzY-zEAjWQ5zN5ecQLDEXxXpSURHhgDdMDIR6KBREMeFyozyhlSzWeWSTqXxIo3YAzP/exec")
                .then(response => {
                    this.websites = (response.data || []).map(item => ({
                        ...item,
                        _loaded: false,
                        _copied: false
                    }));
                })
                .catch(error => {
                    console.error(error);
                })
                .finally(() => {
                    this.loading = false;
                });
        }
    }
});
