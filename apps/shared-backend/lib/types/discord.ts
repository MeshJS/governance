// Discord API types
export interface DiscordUser {
    id: string
    username: string
    discriminator: string
    avatar: string | null
    bot?: boolean
    system?: boolean
    mfa_enabled?: boolean
    locale?: string
    verified?: boolean
    email?: string
    flags?: number
    premium_type?: number
    public_flags?: number
}

export interface DiscordGuild {
    id: string
    name: string
    icon: string | null
    icon_hash?: string | null
    splash: string | null
    discovery_splash: string | null
    owner?: boolean
    owner_id: string
    permissions?: string
    afk_channel_id: string | null
    afk_timeout: number
    widget_enabled?: boolean
    widget_channel_id?: string | null
    verification_level: number
    default_message_notifications: number
    explicit_content_filter: number
    roles: DiscordRole[]
    emojis: DiscordEmoji[]
    features: string[]
    mfa_level: number
    application_id: string | null
    system_channel_id: string | null
    system_channel_flags: number
    rules_channel_id: string | null
    max_presences?: number | null
    max_members?: number
    vanity_url_code: string | null
    description: string | null
    banner: string | null
    premium_tier: number
    premium_subscription_count?: number
    preferred_locale: string
    public_updates_channel_id: string | null
    max_video_channel_users?: number
    max_stage_video_channel_users?: number
    approximate_member_count?: number
    approximate_presence_count?: number
    welcome_screen?: DiscordWelcomeScreen
    nsfw_level: number
    stickers?: DiscordSticker[]
    premium_progress_bar_enabled: boolean
}

export interface DiscordRole {
    id: string
    name: string
    color: number
    hoist: boolean
    icon?: string | null
    unicode_emoji?: string | null
    position: number
    permissions: string
    managed: boolean
    mentionable: boolean
    tags?: DiscordRoleTags
}

export interface DiscordRoleTags {
    bot_id?: string
    integration_id?: string
    premium_subscriber?: null
    subscription_listing_id?: string
    available_for_purchase?: null
    guild_connections?: null
}

export interface DiscordEmoji {
    id: string | null
    name: string | null
    roles?: string[]
    user?: DiscordUser
    require_colons?: boolean
    managed?: boolean
    animated?: boolean
    available?: boolean
}

export interface DiscordSticker {
    id: string
    pack_id?: string
    name: string
    description: string | null
    tags: string
    asset: string
    type: number
    format_type: number
    available?: boolean
    guild_id?: string
    user?: DiscordUser
    sort_value?: number
}

export interface DiscordWelcomeScreen {
    description: string | null
    welcome_channels: DiscordWelcomeScreenChannel[]
}

export interface DiscordWelcomeScreenChannel {
    channel_id: string
    description: string
    emoji_id: string | null
    emoji_name: string | null
}

export interface DiscordChannel {
    id: string
    type: number
    guild_id?: string
    position?: number
    permission_overwrites?: DiscordOverwrite[]
    name?: string
    topic?: string | null
    nsfw?: boolean
    last_message_id?: string | null
    bitrate?: number
    user_limit?: number
    rate_limit_per_user?: number
    recipients?: DiscordUser[]
    icon?: string | null
    owner_id?: string
    application_id?: string
    managed?: boolean
    parent_id?: string | null
    last_pin_timestamp?: string | null
    rtc_region?: string | null
    video_quality_mode?: number
    message_count?: number
    member_count?: number
    thread_metadata?: DiscordThreadMetadata
    member?: DiscordThreadMember
    default_auto_archive_duration?: number
    permissions?: string
    flags?: number
    total_message_sent?: number
    available_tags?: DiscordForumTag[]
    applied_tags?: string[]
    default_reaction_emoji?: DiscordDefaultReaction
    default_thread_rate_limit_per_user?: number
    default_sort_order?: number | null
    default_forum_layout?: number
}

export interface DiscordOverwrite {
    id: string
    type: number
    allow: string
    deny: string
}

export interface DiscordThreadMetadata {
    archived: boolean
    auto_archive_duration: number
    archive_timestamp: string
    locked: boolean
    invitable?: boolean
    create_timestamp?: string | null
}

export interface DiscordThreadMember {
    id?: string
    user_id?: string
    join_timestamp: string
    flags: number
    member?: DiscordGuildMember
}

export interface DiscordGuildMember {
    user?: DiscordUser
    nick?: string | null
    avatar?: string | null
    roles: string[]
    joined_at: string
    premium_since?: string | null
    deaf: boolean
    mute: boolean
    pending?: boolean
    permissions?: string
    communication_disabled_until?: string | null
}

export interface DiscordForumTag {
    id: string
    name: string
    moderated: boolean
    emoji_id: string | null
    emoji_name: string | null
}

export interface DiscordDefaultReaction {
    emoji_id: string | null
    emoji_name: string | null
}

export interface DiscordMessage {
    id: string
    channel_id: string
    author: DiscordUser
    content: string
    timestamp: string
    edited_timestamp: string | null
    tts: boolean
    mention_everyone: boolean
    mentions: DiscordUser[]
    mention_roles: string[]
    mention_channels?: DiscordChannelMention[]
    attachments: DiscordAttachment[]
    embeds: DiscordEmbed[]
    reactions?: DiscordReaction[]
    nonce?: string | number
    pinned: boolean
    webhook_id?: string
    type: number
    activity?: DiscordMessageActivity
    application?: DiscordApplication
    application_id?: string
    message_reference?: DiscordMessageReference
    flags?: number
    referenced_message?: DiscordMessage | null
    interaction?: DiscordMessageInteraction
    thread?: DiscordChannel
    components?: DiscordComponent[]
    sticker_items?: DiscordStickerItem[]
    stickers?: DiscordSticker[]
    position?: number
    role_subscription_data?: DiscordRoleSubscriptionData
}

export interface DiscordChannelMention {
    id: string
    guild_id: string
    type: number
    name: string
}

export interface DiscordAttachment {
    id: string
    filename: string
    description?: string
    content_type?: string
    size: number
    url: string
    proxy_url: string
    height?: number | null
    width?: number | null
    ephemeral?: boolean
    duration_secs?: number
    waveform?: string
    flags?: number
}

export interface DiscordEmbed {
    title?: string
    type?: string
    description?: string
    url?: string
    timestamp?: string
    color?: number
    footer?: DiscordEmbedFooter
    image?: DiscordEmbedImage
    thumbnail?: DiscordEmbedThumbnail
    video?: DiscordEmbedVideo
    provider?: DiscordEmbedProvider
    author?: DiscordEmbedAuthor
    fields?: DiscordEmbedField[]
}

export interface DiscordEmbedFooter {
    text: string
    icon_url?: string
    proxy_icon_url?: string
}

export interface DiscordEmbedImage {
    url: string
    proxy_url?: string
    height?: number
    width?: number
}

export interface DiscordEmbedThumbnail {
    url: string
    proxy_url?: string
    height?: number
    width?: number
}

export interface DiscordEmbedVideo {
    url?: string
    proxy_url?: string
    height?: number
    width?: number
}

export interface DiscordEmbedProvider {
    name?: string
    url?: string
}

export interface DiscordEmbedAuthor {
    name: string
    url?: string
    icon_url?: string
    proxy_icon_url?: string
}

export interface DiscordEmbedField {
    name: string
    value: string
    inline?: boolean
}

export interface DiscordReaction {
    count: number
    me: boolean
    emoji: DiscordEmoji
}

export interface DiscordMessageActivity {
    type: number
    party_id?: string
}

export interface DiscordApplication {
    id: string
    cover_image?: string
    description: string
    icon: string | null
    name: string
    primary_sku_id?: string
    slug?: string
    bot_public?: boolean
    bot_require_code_grant?: boolean
    terms_of_service_url?: string
    privacy_policy_url?: string
    verify_key: string
    guild_id?: string
    guild?: DiscordGuild
    guild_install_params?: DiscordInstallParams
    custom_install_url?: string
    tags?: string[]
    install_params?: DiscordInstallParams
    flags?: number
    hook?: boolean
    bot_user?: DiscordUser
    bot?: boolean
}

export interface DiscordInstallParams {
    scopes: string[]
    permissions: string
}

export interface DiscordMessageReference {
    message_id?: string
    channel_id?: string
    guild_id?: string
    fail_if_not_exists?: boolean
}

export interface DiscordMessageInteraction {
    id: string
    type: number
    name: string
    user: DiscordUser
    member?: DiscordGuildMember
}

export interface DiscordComponent {
    type: number
    custom_id?: string
    disabled?: boolean
    style?: number
    label?: string
    emoji?: DiscordEmoji
    url?: string
    options?: DiscordSelectOption[]
    placeholder?: string
    min_values?: number
    max_values?: number
    components?: DiscordComponent[]
}

export interface DiscordSelectOption {
    label: string
    value: string
    description?: string
    emoji?: DiscordEmoji
    default?: boolean
}

export interface DiscordStickerItem {
    id: string
    name: string
    format_type: number
}

export interface DiscordRoleSubscriptionData {
    role_subscription_listing_id: string
    tier_name: string
    total_months_subscribed: number
    is_renewal: boolean
}

// Discord Stats types
export interface DiscordStats {
    memberCount: number
    totalMessages: number
    uniquePosters: number
    timestamp: string
    period?: {
        start: string
        end: string
    }
}

export interface DiscordStatsParams {
    token: string
    guildId: string
    backfill?: boolean
    backfillYear?: number
    period?: {
        start: string
        end: string
    }
}

export interface DiscordWebhookPayload {
    type: string
    data: any
    timestamp: string
    signature?: string
}

// Discord API Response types
export interface DiscordApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    timestamp: string
}

export interface DiscordRateLimitInfo {
    retry_after: number
    global: boolean
    message: string
} 