const PlaceholdersPopover = (props) => {
    const { extra_placeholders = [], disableDefault = false, function_callback } = props;

    const default_placeholders = [
        '{{POST_ID}}',
        '{{POST_TITLE}}',
        '{{POST_URL}}',
        '{{AUTHOR_ID}}',
        '{{AUTHOR_NAME}}',
        '{{CURRENT_USER_ID}}',
        '{{CURRENT_USER_NAME}}',
        '{{CURRENT_OBJECT_ID}}',
        '{{CURRENT_OBJECT_NAME}}',
        '{{CURRENT_DATE_YMD}}',
        '{{CURRENT_DATE_YMD_HMS}}',
        '{{TIMESTRING:today+10days}}',
        '{{GET:get_name}}',
        '{{SETTING:option_name}}',
        '{{META:meta_key}}',
        '{{TERM_META:meta_key}}',
        '{{USER_META:meta_key}}',
        '{{COOKIE:cookie_name}}',
        '{{SITE_URL}}',
        '{{RANDOM:0-100}}',
        '{{RANDOM:red|blue|green}}',
    ];

    const placeholders = [...extra_placeholders, ...(disableDefault ? [] : default_placeholders)];

    const copyTextToClipboard = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    wp.data.dispatch('core/notices').createNotice('success', __('Copied to clipboard', 'greenlightaddon'));
                })
                .catch(err => {
                    console.error('Error in copying text:', err);
                });
        } else {
            console.warn('Clipboard API not available');
            // Optionally, you could implement a fallback method here.
        }
    }

    return (
        <>
            {placeholders.map((placeholder, index) => (
                <span
                    key={index}
                    className="gspb_inspector_btn gspb_inspector_btn--small"
                    style={{ margin: 0 }}
                    onClick={() => {
                        if(function_callback){
                            function_callback(placeholder);
                        } else {
                            copyTextToClipboard(placeholder);
                        }
                    }}
                >
                    {placeholder}
                </span>
            ))}
        </>
    );
};

export default PlaceholdersPopover;