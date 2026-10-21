package ba.logistitrack.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var splash: FrameLayout
    private lateinit var offline: View
    private lateinit var progress: ProgressBar

    private var fileCallback: ValueCallback<Array<Uri>>? = null

    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val callback = fileCallback
        fileCallback = null
        if (callback == null) return@registerForActivityResult
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            val uris = when {
                data?.clipData != null -> {
                    val list = ArrayList<Uri>()
                    val clip = data.clipData!!
                    for (i in 0 until clip.itemCount) list.add(clip.getItemAt(i).uri)
                    list.toTypedArray()
                }
                data?.data != null -> arrayOf(data.data!!)
                else -> emptyArray()
            }
            callback.onReceiveValue(uris)
        } else {
            callback.onReceiveValue(null)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = getColor(R.color.ink)
        window.navigationBarColor = getColor(R.color.ink)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        splash = findViewById(R.id.splash)
        offline = findViewById(R.id.offline)
        progress = findViewById(R.id.progress)

        findViewById<Button>(R.id.retry).setOnClickListener {
            offline.visibility = View.GONE
            webView.visibility = View.VISIBLE
            webView.reload()
        }

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = true
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = false
            builtInZoomControls = false
            displayZoomControls = false
            setSupportMultipleWindows(false)
            userAgentString = "$userAgentString LogistiTrackAndroid/1.0"
        }

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                return openExternally(request.url)
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                progress.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView, url: String) {
                progress.visibility = View.GONE
                hideSplash()
                // Links marked target=_blank otherwise open a second window. The
                // external handler above still opens maps, tel: and mailto: outside.
                view.evaluateJavascript(
                    "document.querySelectorAll('a[target=\"_blank\"]').forEach(function(a){a.removeAttribute('target')});",
                    null,
                )
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) showOffline()
            }

            override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, errorResponse: WebResourceResponse) {
                if (request.isForMainFrame && errorResponse.statusCode >= 500) showOffline()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progress.progress = newProgress
                if (newProgress >= 100) progress.visibility = View.GONE
            }

            override fun onShowFileChooser(
                webView: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: WebChromeClient.FileChooserParams,
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return try {
                    val intent = params.createIntent()
                    filePicker.launch(Intent.createChooser(intent, getString(R.string.choose_file)))
                    true
                } catch (_: ActivityNotFoundException) {
                    fileCallback = null
                    false
                }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        val startUrl = intent?.data?.toString()?.takeIf { it.startsWith("https://") } ?: BASE_URL
        webView.loadUrl(startUrl)
    }

    private fun hideSplash() {
        if (splash.visibility != View.VISIBLE) return
        splash.animate().alpha(0f).setDuration(280).withEndAction {
            splash.visibility = View.GONE
        }.start()
    }

    private fun showOffline() {
        progress.visibility = View.GONE
        offline.visibility = View.VISIBLE
        webView.visibility = View.INVISIBLE
        hideSplash()
    }

    private fun openExternally(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase() ?: return false
        if (scheme == "https" || scheme == "http") {
            if (uri.host == ALLOWED_HOST) return false
        } else if (scheme !in setOf("mailto", "tel", "sms", "geo", "whatsapp")) {
            return false
        }

        return try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
            true
        } catch (_: ActivityNotFoundException) {
            true
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.data?.toString()?.let { if (it.startsWith("https://")) webView.loadUrl(it) }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val BASE_URL = "https://logistic-management-ui.pages.dev/"
        private const val ALLOWED_HOST = "logistic-management-ui.pages.dev"
    }
}
