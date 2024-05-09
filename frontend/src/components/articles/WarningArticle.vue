<template>
    <article class="message is-warning">
        <div class="message-header">
            <p>{{ title }}</p>
            <button class="delete" aria-label="delete"></button>
        </div>
        <div class="message-body">
            {{ message }}
        </div>
    </article>
</template>

<script>

export default {
    name: 'WarningArticle',
    props: {
        title: {
            type: String,
            default: 'Warning'
        },
        message: {
                type: String,
                required: true,
                default: 'None'
        }
    }
  }
</script>