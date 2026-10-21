# Keep WebView JavaScript interface names if one is added later.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
