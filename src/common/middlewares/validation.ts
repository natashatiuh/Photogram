export const validation = (schema: any) => {
    return async (req: any, res: any, next: any) => {
        try {
            req.validated = await schema.validateAsync(req.body)

            next()
        } catch (error) {
            console.log(error)
            res.send({ success: false })
        }
    }
}