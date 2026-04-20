var vm = new Vue({
    el: "#app",
    data: {
        websites: [],
        query: '',
        loading: true,
        isDark: false,
        listView: false
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

        convertDriveUrl(url) {
            if (!url) return '';
            const idMatch = url.match(/[-\w]{25,}/);
            return idMatch ? `https://lh3.googleusercontent.com/d/${idMatch[0]}` : url;
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
