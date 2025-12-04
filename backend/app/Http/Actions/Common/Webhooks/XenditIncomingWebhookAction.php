<?php

namespace HiEvents\Http\Actions\Common\Webhooks;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\ResponseCodes;
use HiEvents\Services\Application\Handlers\Order\Payment\Xendit\IncomingWebhookHandler;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

class XenditIncomingWebhookAction extends BaseAction
{
    public function __invoke(Request $request): Response
    {
        try {
            $payload = $request->all();

            dispatch(static function (IncomingWebhookHandler $handler) use ($payload) {
                $handler->handle($payload);
            })->catch(function (Throwable $exception) use ($payload) {
                logger()->error(__('Failed to handle incoming Xendit webhook'), [
                    'exception' => $exception,
                    'payload' => $payload,
                ]);
            });

        } catch (Throwable $exception) {
            logger()?->error($exception->getMessage(), $exception->getTrace());
            return $this->noContentResponse(ResponseCodes::HTTP_BAD_REQUEST);
        }

        return $this->noContentResponse();
    }
}
